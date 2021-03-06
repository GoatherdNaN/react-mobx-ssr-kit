import { message } from 'antd'
import fetch from 'isomorphic-fetch';
import { stringify } from 'qs';
import { METHOD } from 'constants/dict';
import { sessionStorage } from './storage'
import history from '../history';

function hasPrototype(object, name) {
  return Object.prototype.hasOwnProperty.call(object, name) && name in object;
}

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response.json().then(resp => {
      return new Promise(resolve => {
        if (resp && (!resp.code || resp.code === 200)) {
          const url = response.url.replace(window.location.origin, '');
          setCache(url, resp);
        } else {
          message.info(resp.msg || '操作失败')
        }
        resolve(resp);
      });
    });
  }
  const errortext = codeMessage[response.status] || response.statusText;
  message.error(errortext);
  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;
  throw error;
}

function cacheUrl(url) {
  if (hasPrototype(sessionStorage, url)) {
    // 有这个key
    if (sessionStorage.getJSONItem(url) !== '0') {
      return sessionStorage.getJSONItem(url);
    }
  } else {
    sessionStorage.setJSONItem(url, '0');
  }
}

function setCache(url, data) {
  if (hasPrototype(sessionStorage, url) && sessionStorage.getJSONItem(url) === '0') {
    sessionStorage.setJSONItem(url, JSON.stringify(data));
  }
}

/**
 * 请求函数封装
 * @param  {object}  base    包含以下两项
 *         @param  {string}  url       请求的地址
 *         @param  {string}  method    请求方式
 * @param  {object}  params    请求的参数
 * @param  {boolean} cache     是否缓存
 * @param  {boolean} jsonType  参数模式
 */
export default function request(base, params = null, cache = false, jsonType = false) {
  let { url } = base;
  // const token = storage.getJSONItem('token');
  const { method } = base;
  const options = {
    headers: {
      // token,
      'Content-Type': jsonType
        ? 'application/json;charset=UTF-8'
        : 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    mode: jsonType ? 'cors' : 'no-cors', // 必须设置为这个模式，否则使用json数据提交时，headers设置会无效，参见链接：https://github.com/dvajs/dva/issues/282
    credentials: 'include',
    method,
  };
  // 非get方式请求参数处理
  if (method !== METHOD.GET && params) {
    options.body = jsonType ? JSON.stringify(params) : stringify(params);
  }
  // get方式请求参数处理
  if (method === METHOD.GET && params && JSON.stringify(params) !== '{}') {
    url += `?${stringify(params)}`;
  }
  // 控制get请求的缓存
  if (method === METHOD.GET && cache) {
    const back = cacheUrl(url);
    if (back) {
      return new Promise(resolve => {
        resolve(JSON.parse(back));
      });
    }
  }
  // 网络异常处理
  if (!navigator.onLine) {
    // 处理网络异常
    return;
  }
  const fetchPromise = fetch(url, options);
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('fetch timeout'));
    }, 20000); // 20s请求过期
  });
  return Promise.race([fetchPromise, timeoutPromise])
    .then(checkStatus)
    .catch(e => {
      if (!e) return;
      let status = e.name
      // 处理错误网络状态码
      if (status === 401) {
        // @HACK
        history.push('/login');
      }
    });
}
