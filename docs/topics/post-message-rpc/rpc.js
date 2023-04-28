const global = window

(function() {
  const promiseMap = new Map();

  let id = 0

  function genId() {
    id++
  }

  /**
   * postMessage 实现的 rpc 调用
   * @param {{ jsonrpc: '2.0', method: string, params: any, id: string | number }} data rpc 请求数据
   */
  window.rpc = function(data) {
    const usedId = genId()

    return new Promise(function(resolve, reject) {
      
    })
  }

})()
