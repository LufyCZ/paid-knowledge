import { createWalletClient, Hex, http, publicActions, } from 'viem'
import { worldchain } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY
if (!WALLET_PRIVATE_KEY) {
  throw new Error("WALLET_PRIVATE_KEY environment variable is not set")
}

export const client = createWalletClient({
  transport: http(worldchain.rpcUrls.default.http[0]),
  chain: worldchain,
  account: privateKeyToAccount(WALLET_PRIVATE_KEY as Hex)
}).extend(publicActions)

export const bountyManagerAddress = "0x" as const

export const bountyManagerAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdc",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AnswerIdAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AnswerIdDoesNotExist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BountyDoesNotExist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BountyHasExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BountyHasNoValueLeft",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BountyHashAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BountyIdAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BountyIdEmpty",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpirationDateInPast",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidCurrency",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyBountyOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddressNotAllowed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expirationDate",
        "type": "uint256"
      }
    ],
    "name": "BountyCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "BountyExpired",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BountyPaidOut",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "answerId",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "answerer",
        "type": "address"
      }
    ],
    "name": "answerBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "bountiesToBountyData",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "enum BountyManager.Currency",
        "name": "currency",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "perProofValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalValueLeft",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expirationDate",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "bountyIdToAnswers",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "answerId",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "answerer",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "bountyOwnerToBounties",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "bountyIds",
        "type": "bytes[]"
      }
    ],
    "name": "cleanupExpiredBounties",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "bountyOwner",
        "type": "address"
      },
      {
        "internalType": "enum BountyManager.Currency",
        "name": "currency",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "perProofValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalValueLeft",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expirationDate",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "dataHash",
        "type": "bytes"
      }
    ],
    "name": "createBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "dataHashToBountyId",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllOpenBounties",
    "outputs": [
      {
        "internalType": "bytes[]",
        "name": "",
        "type": "bytes[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getBountiesByOwner",
    "outputs": [
      {
        "internalType": "bytes[]",
        "name": "",
        "type": "bytes[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getBountyCountByOwner",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      }
    ],
    "name": "getBountyData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "bountyId",
            "type": "bytes"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "enum BountyManager.Currency",
            "name": "currency",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "perProofValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalValueLeft",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expirationDate",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct BountyManager.BountyData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getOpenBountyCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      }
    ],
    "name": "isBountyExpired",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "openBountyIds",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "bountyId",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "answerId",
        "type": "bytes"
      }
    ],
    "name": "payoutBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "bountyIds",
        "type": "bytes[]"
      },
      {
        "internalType": "bytes[]",
        "name": "answerIds",
        "type": "bytes[]"
      }
    ],
    "name": "payoutBountyBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const