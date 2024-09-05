// 你需要反代的 Channel 的 username
const USERNAME = ENV_USERNAME

// 访问这个 worker 的 URL
let BASE_URL = ''

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function replaceText(resp){
    let ct = resp.headers.get('content-type')
    if(!ct)
      return resp
      
    ct = ct.toLowerCase()
    if(!(ct.includes('text/html') || ct.includes('application/json') || ct.includes('application/javascript')))
      return resp

    let text = await resp.text()
    text=text.replace(/<a class="tgme_channel_join_telegram" href="\/\/telegram\.org\/dl[\?a-z0-9_=]*">/g, 
        `<a class="tgme_channel_join_telegram" href="https://t.me/${USERNAME}">`)
      .replace(/<a class="tgme_channel_download_telegram" href="\/\/telegram\.org\/dl[\?a-z0-9_=]*">/g, 
        `<a class="tgme_channel_download_telegram" href="https://t.me/${USERNAME}">`)
      .replace(/Download Telegram/g, "加入频道")
      .replace(/\/\/cdn4.cdn-telegram.org/g, `//${BASE_URL}/tgcdn4`)  //html文件中的cdn
      .replace(/\/\/cdn5.cdn-telegram.org/g, `//${BASE_URL}/tgcdn5`)
      .replace(/\\\/\\\/cdn4.cdn-telegram.org/g, `\\/\\/${BASE_URL}\\/tgcdn4`)  //json文件中的cdn
      .replace(/\\\/\\\/cdn5.cdn-telegram.org/g, `\\/\\/${BASE_URL}\\/tgcdn5`)
      .replace(/\/\/core.telegram.org/g, `//${BASE_URL}/tgcore`)
      .replace(/\/\/telegram.org/g, `//${BASE_URL}/tgorg`)
      .replace(/\/\/t.me/g, `//${BASE_URL}`)

    return new Response(text, {
      headers: resp.headers
  })
}

async function handleRequest(request) {
    var u = new URL(request.url);

    BASE_URL = u.host;

    const pathParts = u.pathname.split('/')
    pathParts.shift()
    switch (pathParts.length>0 ? pathParts[0] : '') {
    // telegram.org 的节点
    case 'tgorg':
      u.host = 'telegram.org';
      u.pathname = `${pathParts.slice(1).join('/')}`;
      break;
    case 'tgcore':
      u.host = 'core.telegram.org';
      u.pathname = `${pathParts.slice(1).join('/')}`;
      break;
    // telegram.org 的节点
    case 'tgcdn4':
      u.host = `cdn4.cdn-telegram.org`;
      u.pathname = `${pathParts.slice(1).join('/')}`;
      break;
    case 'tgcdn5':
      u.host = `cdn5.cdn-telegram.org`;
      u.pathname = `${pathParts.slice(1).join('/')}`;
      break;
    default:
      u.host = 't.me'
      // 主页
      if(u.pathname==='/')
        u.pathname = `/s/${USERNAME}`;
      break;
    }

    const req = new Request(u, {
        method: 'get',
    });
    const result = await fetch(req);
    return replaceText(result)
}
