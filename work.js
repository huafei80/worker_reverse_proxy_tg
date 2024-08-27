/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// 你需要反代的 Channel 的 username
const USERNAME = 'huafei080'
// 访问这个 worker 的 URL，可以是初始的 .workers.dev 的域名。注意不是你想要嵌入到的网页的地址
const BASE_URL = 'pdg.ppth.cc'

const CHANNEL_URL = `https://t.me/s/${USERNAME}`

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function replaceText(resp, isEmbedded){
    let ct = resp.headers.get('content-type')
    console.log(ct)
    if(!ct)return resp
    ct=ct.toLowerCase()
    if(!(ct.includes('text/html')||ct.includes('application/json')))return resp
    let text = await resp.text()
    text=text.replace(/<a class="tgme_channel_join_telegram" href="\/\/telegram\.org\/dl[\?a-z0-9_=]*">/g, 
        `<a class="tgme_channel_join_telegram" href="https://t.me/${USERNAME}">`)
      .replace(/<a class="tgme_channel_download_telegram" href="\/\/telegram\.org\/dl[\?a-z0-9_=]*">/g, 
        `<a class="tgme_channel_download_telegram" href="https://t.me/${USERNAME}">`)
      .replace(/\\?\/\\?\/telegram.org\\?\//g, `//${BASE_URL}/tgorg/`)
      .replace(/\\?\/\\?\/cdn(\d).telesco.pe\\?\//g, `//${BASE_URL}/ts/$1/`)
      .replace(/t.me\/[A-z0-9\_]{5,}\/?/g, `${BASE_URL}/`)
      .replace(/<div class="tgme_channel_download_telegram_bottom">to view and join the conversation<\/div>/g, "")
      .replace(/Download Telegram/g, "Join Channel")
      .replace(/media_not_supported_cont/g, "media_want_supported_cont")
      .replace(/media_supported_cont/g, "media_not_supported_cont")
      .replace(/media_want_supported_cont/g, "media_supported_cont")
      return new Response(text, {
        headers: { "content-type": ct }
    })
}

async function replaceTextForTgOrg(resp){
    let ct = resp.headers.get('content-type')
    if(!ct)return resp
    ct=ct.toLowerCase()
    if(!(ct.includes('text/css')))return resp
    let text = await resp.text()
    text=text.replace(/url\(\//g, `url(//${BASE_URL}/tgorg/`)
      .replace(/url\('\//g, `url('//${BASE_URL}/tgorg/`)
    return new Response(text, {
        headers: { "content-type": ct }
    })
}

async function handleRequest(request) {
    var u = new URL(request.url);
    const isEmbedded = u.search.includes('emb');
    var reg = /\/[0-9]*$/
    // 统计节点
    if(u.pathname==='/v/'){
      return new Response('true',{
        headers: { "content-type": "application/json" }
      })
    }
    // 主页
    if(u.pathname==='/'){
      const req = new Request(CHANNEL_URL, {
        method: 'GET',
      })
      const result = await fetch(req)
      return replaceText(result, isEmbedded)
    }
    // 消息定位
    if(reg.test(u.pathname)){
      const req = new Request(CHANNEL_URL+u.pathname, {
        method: 'GET',
      })
      const result = await fetch(req)
      return replaceText(result)
    }
    

    const pathParts = u.pathname.split('/')
    pathParts.shift()
    const host = pathParts.length>0 ? pathParts[0] : ''
    const hostParam = pathParts.length>1 ? pathParts[1] : ''
    // telegram.org 的节点
    if(host==='tgorg'){
      const req = new Request(`https://telegram.org/${pathParts.slice(1).join('/')}`, {
        method: 'GET',
      })
      const result = await fetch(req)
      return replaceTextForTgOrg(result)
    }
    // telescope 的节点
    if(host==='ts'){
      const req = new Request(`https://cdn${hostParam}.telesco.pe/${pathParts.slice(2).join('/')}`, {
        method: 'GET',
      })
      const result = await fetch(req)
      return result
    }
    // 加载更多
    if(host==='s'&&hostParam===USERNAME){
        u.host = 't.me'
        const req = new Request(u, {
            method: 'POST',
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        });
        const result = await fetch(req);
        return replaceText(result)
    }

    return await fetch(new Request('https://qwq.clansty.workers.dev',{
        method: request.method,
        headers: request.headers,
        body: request.body
    }))
}
