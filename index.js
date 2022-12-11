const axios = require('axios');
 const Service = axios.create({
    baseURL: 'http://65.108.14.25:8080',
    timeout: 1000 * 30,
    headers: {
        'Content-Type': 'application/json',
    },
});
Service.interceptors.response.use(
    (response) => {
        let data = response.data;
        return data;
    },
    (error) => {
        // console.log(error);
        return Promise.reject(error);
    }
);
function post(data) {
    return Service.request({
        data,
        method: 'post',
    });
}
async function GetCurrencyScale() {
    let res = await post({
        jsonrpc: '2.0',
        method: 'get_currencies',
        params: [],
        id: 1,
    });
    return res.result || [];
}
async function GetAccount(address) {
    let data = Array.isArray(address)
        ? address.slice(0,20).map((ad) => {
              return {
                  jsonrpc: '2.0',
                  method: 'get_account',
                  params: [ad],
                  id: 1,
              };
          })
        : [{
              jsonrpc: '2.0',
              method: 'get_account',
              params: [address],
              id: 1,
          }];
    let res = await post(data);
    if (res) {
        return res.map((account) => {
            return account.result;
        });
    }
}
async function GetTowerStateView(address) {
    let data = Array.isArray(address)
        ? address.slice(0,20).map((ad) => {
              return {
                  jsonrpc: '2.0',
                  method: 'get_tower_state_view',
                  params: [ad],
                  id: 1,
              };
          })
        : [{
              jsonrpc: '2.0',
              method: 'get_tower_state_view',
              params: [address],
              id: 1,
          }];
    let res = await post(data);
    // console.log('proof', res)
    if (res) {
        return res.map((account) => {
            return account.result;
        });
    }
}
async function GetBlanceAndProofs(address) {
    let balances = await GetAccount(address);
    let proofs = await GetTowerStateView(address);
    let bMap = {};
    balances.forEach((account, i) => {
        bMap[account.address] = { ...account, ...proofs[i] };
    });
    return Object.values(bMap);
}


const account = [
    "cd52d64f530f40453c2403bd9c3ac652",
]
async function getDate () {
    let accounts = await GetBlanceAndProofs(account);
    let total = {
        tag: '合计',
        balance:0,
        proofs: 0,
        addressfull:'',
        height: '',
        latest_epoch_mining: '',
        proofsAndheight: '',
    }
    let tabledata =  accounts.map((account) => {
        const data = {
          tag: account.address.slice(0, 4).toUpperCase(),
        //   address: account.address.slice(0.6),
          addressfull: account.address,
          balance: (
            (account.balances[0].amount || 0) / 1000000).toFixed(2),
          proofs: account.actual_count_proofs_in_epoch || 0,
          height: account.verified_tower_height || 0,
          latest_epoch_mining: account.latest_epoch_mining || 0,
        };
        data.proofsAndheight = `${data.proofs} (${data.height})`;
        total.balance += +data.balance;
        total.proofs += +data.proofs;
        return data;
      });
      total.balance = total.balance.toFixed(2);
    //   total.proofs = total.proofs.toFixed(2)
    tabledata.push(total)
    console.table(tabledata.sort((a,b) => a.proofs - b.proofs))
}
getDate()