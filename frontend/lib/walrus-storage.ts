import { walrusClient, createWalrusSigner } from "@/app/api/walrus";
import { fromHex, toHex } from "viem";

export interface WalrusRecord {
  id: string;
  type: string; // 'bounty_form', 'form_question', 'form_response', etc.
  data: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
  version: number;
  parent_id?: string; // For hierarchical data (e.g., questions belong to forms)
  relationships?: Record<string, string[]>; // For complex relationships
}

export interface WalrusQuery {
  type?: string;
  parent_id?: string;
  metadata_filter?: Record<string, any>;
  created_after?: string;
  created_before?: string;
  limit?: number;
  offset?: number;
}

export interface WalrusIndex {
  records_by_type: Record<string, string[]>; // type -> blob_ids
  records_by_parent: Record<string, string[]>; // parent_id -> blob_ids
  record_id_to_blob: Record<string, string>; // record_id -> blob_id
  metadata_index: Record<string, Record<string, Record<string, string[]>>>; // type -> field -> values -> blob_ids
  total_records: number;
  last_updated: string;
}

export class WalrusStorage {
  private static INDEX_BLOB_KEY = "walrus_storage_index";
  private static cache: Map<string, WalrusRecord> = new Map();
  private static indexCache: WalrusIndex | null = null;

  /**
   * Save a record to Walrus
   */
  static async saveRecord<T>(
    type: string,
    data: T,
    options: {
      id?: string;
      parent_id?: string;
      metadata?: any;
      relationships?: Record<string, string[]>;
    } = {}
  ): Promise<{
    success: boolean;
    id?: string;
    blobId?: string;
    error?: string;
  }> {
    try {
      const recordId = options.id || this.generateId();

      const record: WalrusRecord = {
        id: recordId,
        type,
        data,
        metadata: options.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
        parent_id: options.parent_id,
        relationships: options.relationships,
      };

      // Store the record
      const recordBlob = await walrusClient.writeBlob({
        blob: new TextEncoder().encode(JSON.stringify(record)),
        deletable: false,
        epochs: 100,
        signer: createWalrusSigner(),
      });

      // Update index
      await this.updateIndex(
        recordId,
        type,
        recordBlob.blobId,
        options.parent_id,
        options.metadata
      );

      // Cache the record
      this.cache.set(recordId, record);

      return {
        success: true,
        id: recordId,
        blobId: recordBlob.blobId,
      };
    } catch (error) {
      console.error("Failed to save record to Walrus:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get a single record by ID
   */
  static async getRecord(
    id: string
  ): Promise<{ success: boolean; data?: WalrusRecord; error?: string }> {
    try {
      // Check cache first
      if (this.cache.has(id)) {
        return { success: true, data: this.cache.get(id) };
      }

      // Get from index
      const index = await this.getIndex();
      const blobId = this.findBlobIdInIndex(index, id);

      if (!blobId) {
        return { success: false, error: "Record not found" };
      }

      const blob = await walrusClient.readBlob({ blobId });
      const record: WalrusRecord = JSON.parse(new TextDecoder().decode(blob));

      // Cache the record
      this.cache.set(id, record);

      return { success: true, data: record };
    } catch (error) {
      console.error("Failed to get record from Walrus:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Query records with filters
   */
  static async queryRecords(
    query: WalrusQuery
  ): Promise<{ success: boolean; data?: WalrusRecord[]; error?: string }> {
    try {
      const index = await this.getIndex();
      let candidateBlobIds: string[] = [];

      // Filter by type
      if (query.type) {
        candidateBlobIds = index.records_by_type[query.type] || [];
      } else {
        // Get all records
        candidateBlobIds = Object.values(index.records_by_type).flat();
      }

      // Filter by parent_id
      if (query.parent_id) {
        const parentBlobIds = index.records_by_parent[query.parent_id] || [];
        candidateBlobIds = candidateBlobIds.filter((id) =>
          parentBlobIds.includes(id)
        );
      }

      // Filter by metadata
      if (query.metadata_filter && query.type) {
        for (const [field, value] of Object.entries(query.metadata_filter)) {
          const fieldIndex =
            index.metadata_index[query.type]?.[field]?.[String(value)] || [];
          candidateBlobIds = candidateBlobIds.filter((id) =>
            fieldIndex.includes(id)
          );
        }
      }

      // Fetch all candidate records
      const records: WalrusRecord[] = [];
      for (const blobId of candidateBlobIds) {
        try {
          const blob = await walrusClient.readBlob({ blobId });
          const record: WalrusRecord = JSON.parse(
            new TextDecoder().decode(blob)
          );

          // Apply additional filters
          let includeRecord = true;

          if (query.created_after && record.created_at < query.created_after) {
            includeRecord = false;
          }
          if (
            query.created_before &&
            record.created_at > query.created_before
          ) {
            includeRecord = false;
          }

          if (includeRecord) {
            records.push(record);
            // Cache the record
            this.cache.set(record.id, record);
          }
        } catch (error) {
          console.warn(`Failed to read blob ${blobId}:`, error);
        }
      }

      // Sort by created_at (newest first)
      records.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || records.length;
      const paginatedRecords = records.slice(offset, offset + limit);

      return { success: true, data: paginatedRecords };
    } catch (error) {
      console.error("Failed to query records from Walrus:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update a record
   */
  static async updateRecord<T>(
    id: string,
    updates: Partial<T>,
    metadata?: any
  ): Promise<{ success: boolean; blobId?: string; error?: string }> {
    try {
      const existingResult = await this.getRecord(id);
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: "Record not found" };
      }

      const existingRecord = existingResult.data;
      const updatedRecord: WalrusRecord = {
        ...existingRecord,
        data: { ...existingRecord.data, ...updates },
        metadata: metadata || existingRecord.metadata,
        updated_at: new Date().toISOString(),
        version: existingRecord.version + 1,
      };

      // Store the updated record
      const recordBlob = await walrusClient.writeBlob({
        blob: new TextEncoder().encode(JSON.stringify(updatedRecord)),
        deletable: false,
        epochs: 100,
        signer: createWalrusSigner(),
      });

      // Update index with new blob ID
      await this.updateIndex(
        id,
        updatedRecord.type,
        recordBlob.blobId,
        updatedRecord.parent_id,
        updatedRecord.metadata,
        true // isUpdate
      );

      // Update cache
      this.cache.set(id, updatedRecord);

      return {
        success: true,
        blobId: recordBlob.blobId,
      };
    } catch (error) {
      console.error("Failed to update record in Walrus:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete a record (marks as deleted, doesn't actually remove from Walrus)
   */
  static async deleteRecord(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.updateRecord(id, {
        deleted: true,
        deleted_at: new Date().toISOString(),
      });
      if (result.success) {
        this.cache.delete(id);
      }
      return result;
    } catch (error) {
      console.error("Failed to delete record from Walrus:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get or create the index
   */
  private static async getIndex(): Promise<WalrusIndex> {
    if (this.indexCache) {
      return this.indexCache;
    }

    try {
      // Try to read existing index
      const indexBlob = await walrusClient.readBlob({
        blobId: this.INDEX_BLOB_KEY,
      });
      const index: WalrusIndex = JSON.parse(
        new TextDecoder().decode(indexBlob)
      );
      this.indexCache = index;
      return index;
    } catch (error) {
      // Index doesn't exist, create new one
      const newIndex: WalrusIndex = {
        records_by_type: {},
        records_by_parent: {},
        record_id_to_blob: {},
        metadata_index: {},
        total_records: 0,
        last_updated: new Date().toISOString(),
      };
      this.indexCache = newIndex;
      return newIndex;
    }
  }

  /**
   * Update the index
   */
  private static async updateIndex(
    recordId: string,
    type: string,
    blobId: string,
    parentId?: string,
    metadata?: any,
    isUpdate: boolean = false
  ): Promise<void> {
    try {
      const index = await this.getIndex();

      // Update record_id_to_blob mapping
      index.record_id_to_blob[recordId] = blobId;

      // Update records_by_type
      if (!index.records_by_type[type]) {
        index.records_by_type[type] = [];
      }
      if (!index.records_by_type[type].includes(blobId)) {
        index.records_by_type[type].push(blobId);
      }

      // Update records_by_parent
      if (parentId) {
        if (!index.records_by_parent[parentId]) {
          index.records_by_parent[parentId] = [];
        }
        if (!index.records_by_parent[parentId].includes(blobId)) {
          index.records_by_parent[parentId].push(blobId);
        }
      }

      // Update metadata index
      if (metadata) {
        if (!index.metadata_index[type]) {
          index.metadata_index[type] = {};
        }

        for (const [field, value] of Object.entries(metadata)) {
          if (!index.metadata_index[type][field]) {
            index.metadata_index[type][field] = {};
          }
          if (!index.metadata_index[type][field][String(value)]) {
            index.metadata_index[type][field][String(value)] = [];
          }
          if (
            !index.metadata_index[type][field][String(value)].includes(blobId)
          ) {
            index.metadata_index[type][field][String(value)].push(blobId);
          }
        }
      }

      // Update counters
      if (!isUpdate) {
        index.total_records++;
      }
      index.last_updated = new Date().toISOString();

      // Save updated index
      await walrusClient.writeBlob({
        blob: new TextEncoder().encode(JSON.stringify(index)),
        deletable: false,
        epochs: 100,
        signer: createWalrusSigner(),
      });

      this.indexCache = index;
    } catch (error) {
      console.error("Failed to update index:", error);
    }
  }

  /**
   * Find blob ID for a record ID in the index
   */
  private static findBlobIdInIndex(
    index: WalrusIndex,
    recordId: string
  ): string | null {
    return index.record_id_to_blob[recordId] || null;
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  static clearCache(): void {
    this.cache.clear();
    this.indexCache = null;
  }

  /**
   * Get storage statistics
   */
  static async getStats(): Promise<{
    total_records: number;
    records_by_type: Record<string, number>;
    cache_size: number;
    last_updated: string;
  }> {
    try {
      const index = await this.getIndex();
      const recordsByType = Object.fromEntries(
        Object.entries(index.records_by_type).map(([type, ids]) => [
          type,
          ids.length,
        ])
      );

      return {
        total_records: index.total_records,
        records_by_type: recordsByType,
        cache_size: this.cache.size,
        last_updated: index.last_updated,
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      return {
        total_records: 0,
        records_by_type: {},
        cache_size: 0,
        last_updated: new Date().toISOString(),
      };
    }
  }
}
