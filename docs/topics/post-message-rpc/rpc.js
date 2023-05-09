/**
 * 全双工 rpc 调用，基于 postMessage 实现, 可以实现跨浏览器窗口的通信。
 * 全双工：双方都可以主动发起请求，双方都可以主动返回结果。可以传参，可以获取远程函数的返回结果。
 * jsonrpc 规范：https://www.jsonrpc.org/specification
 */

(function() {
  const jsonrpcVersion = '2.0'

  /** 注册进来的 rpc 函数 */
  const rpcFuncs = {}

  const promiseMap = new Map();

  let id = 0

  function genId() {
    return ++id
  }

  /** 监听所有的消息，只处理和 rpc 相关的 */
  window.addEventListener('message', async function(event) {
    const data = event.data

    if (!data || !data.jsonrpc) {
      return
    }

    const { jsonrpc, method, params, id } = data

    if (jsonrpc !== jsonrpcVersion) {
      return
    }

    const [resolve, reject] = promiseMap.get(id) || []

    if (resolve && reject) {
      // 接收到 rpc 调用的结果
      if (data.error) {
        reject(data.error)
      } else {
        resolve(data.result)
      }
    } else {
      // 获取调用结果并返回给调用方
      let message = {
        id,
        jsonrpc: jsonrpcVersion,
        error: {
          code: -32601,
          message: 'Method not found',
          data,
        },
      }

      if (method) {
        // 调用注册的 rpc 函数
        const rpcFunc = rpcFuncs[method]
        if (rpcFunc) {
          try {
            const result = await rpcFunc(...params)
            message = {
              id,
              jsonrpc: jsonrpcVersion,
              result,
            }
          } catch (error) {
            message = {
              id,
              jsonrpc: jsonrpcVersion,
              error: {
                code: -32603,
                message: 'Internal error',
                data: error,
              },
            }
          }
        }
      }

      // 结果通过 postMessage 返回
      event.source.postMessage(message, event.origin)
    }
  })

  /**
   * postMessage 实现的 rpc 调用
   * @param {Window} remote 目标窗口
   * @param {{ method: string, params: any[], jsonrpc: '2.0', id: string | number }} data rpc 请求数据
   */
  window.rpc = function(remote, data) {
    const usedId = genId()

    remote.postMessage({
      ...data,
      id: usedId,
      jsonrpc: jsonrpcVersion,
    }, remote.origin)

    return new Promise(function(resolve, reject) {
      promiseMap.set(usedId, [resolve, reject])
    })
  }

  /**
   * 注册 rpc 函数
   * 简单实现
   */
  window.registerRpcFunc = function(_rpcFuncs) {
    Object.assign(rpcFuncs, _rpcFuncs)
  }

})()
