#!/usr/bin/env node

// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

async function search (chainAddr, blocknum, hash) {
    // Initialise the provider to connect to the local node
    const provider = new WsProvider(chainAddr);
  
    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });
  
    // Retrieve the chain & node information information via rpc calls
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version()
    ]);
  
    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
    
    var signedBlock
    if (blocknum == undefined && hash == undefined) {
        signedBlock = await api.rpc.chain.getBlock()
    } else if (blocknum == undefined) {
        signedBlock = await api.rpc.chain.getBlock(hash)
    } else {
        const blockHash = await api.rpc.chain.getBlockHash(blocknum)
        signedBlock = await api.rpc.chain.getBlock(blockHash)
    }
    
    console.log(`Block number: ${signedBlock.block.header.number}`)
    console.log(`Block hash: ${signedBlock.block.header.hash.toHex()}`)

    console.log('Extrinsics:')
    signedBlock.block.extrinsics.forEach((ex, index) => {
        const { isSigned, meta, method: { args, method, section } } = ex;
        // explicit display of name, args & documentation
        console.log(index, `: ${section}.${method}(${args.map((a) => a.toString()).join(', ')})`)
    })

}

yargs(hideBin(process.argv))
  .command('search', 'search for a block by number or hash', (yargs) => {}, (argv) => {
    var chain
    if (argv.chain == "kusama") {
        chain = 'wss://kusama-rpc.polkadot.io'
    } else if (argv.chain == "polkadot") {
        chain = 'wss://rpc.polkadot.io'
    }
    search(chain, argv.blocknum, argv.hash).catch(console.error).finally(() => process.exit())
  })
  .option('chain', {
    type: 'string',
    default: 'polkadot',
    description: 'Which chain to search on, kusama or polkadot'
  })
  .option('blocknum', {
    type: 'string',
    description: 'Search by block number'
  })
  .option('hash', {
    type: 'string',
    description: 'Search by hash'
  })
  .argv
