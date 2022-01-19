const axios = require('axios')
const fs = require('fs')
const cheerio = require('cheerio')
const { resolve } = require('path')

const BASE_URL = 'https://gamefaqs.gamespot.com'


/**********************************************
* header do requet que o browser faz ao buscar o site 
* essas informações abaixo eu pego na parte de Network do 
* inspecionar elemento (primeiro arquivo, que é o arquivo de
* request do site) da url que eu estou trabalhando, 
* as vezes percisa desse header pq o site identifica que é 
* um scrapper e bloqueia o acesso
************************************************/
const browserHeaders = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'cache-control': 'max-age=0',
    'cookie': 'gf_dvi=ZjYxZTgyMWMwMDA5MWUzMDc0MzQxYzJlZmRhY2NhMTcyMjllMjgzNjkyMjJhNDgzMWU2MGVkMGFkZDhkNjFlODIxYzA%3D; gf_geo=MTMxLjcyLjIwMy4xNjY6NzY6NzI2; fv20220120=1; _BB.bs=d|2; AMCVS_3C66570E5FE1A4AB0A495FFC%40AdobeOrg=1; s_vnum=1645194948435%26vn%3D1; s_invisit=true; s_lv_undefined_s=First%20Visit; chsn_cnsnt=tglr_ref%2Ctglr_req%2Ctglr_sess_id%2Ctglr_sess_count%2Ctglr_anon_id%2Ctglr_tenant_id%2Ctglr_virtual_ref%2Ctglr_transit_id%2Cchsn_dcsn_cache%2Cpmpdid%2Cpmpredirected%2Cpmpredir%2Cfuseid%2Ccohsn_xs_id%2Cchsn_auth_id%2ChashID%2CetagID%2CreinforcedID%2ChttpOnlyID%2CfpID%2CflID%2Ctglr_smpl%2Ctglr_reinforce%2Ctglr_gpc_sess_id%2Ctglr_hash_id; tglr_tenant_id=src_1kYs5kGF0gH8ObQlZU8ldA7KFYZ; tglr_sess_id=c9748eae-3d30-4f39-a78e-ae3e7dc369e8; tglr_sess_count=1; tglr_req=https://gamefaqs.gamespot.com/; tglr_ref=https://www.google.com/; tglr_anon_id=4e3f6f96-e486-49a4-a06f-dda7dde08c4f; cohsn_xs_id=ee9a463d-6a3e-4f98-84fe-57fa722634e6; s_cc=true; AMCV_3C66570E5FE1A4AB0A495FFC%40AdobeOrg=1585540135%7CMCIDTS%7C19012%7CMCMID%7C63503401684605401424578666514867204089%7CMCAAMLH-1643207748%7C4%7CMCAAMB-1643207748%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1642610149s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C4.4.0; aam_uuid=59638626479526584223848788954496039137; dw-tag=untagged; _BB.enr=0; QSI_SI_6txS2NEjYiEjMJU_intercept=true; s_sq=%5B%5BB%5D%5D; _BB.d=0|||4; OptanonConsent=isIABGlobal=false&datestamp=Wed+Jan+19+2022+11%3A54%3A52+GMT-0300+(Hor%C3%A1rio+Padr%C3%A3o+de+Bras%C3%ADlia)&version=6.7.0&hosts=&consentId=5885ae70-9ac8-40f0-a19e-28dd4de951bc&interactionCount=1&landingPath=NotLandingPage&groups=C0002%3A1%2CC0003%3A1%2CC0004%3A1%2CC0005%3A1&AwaitingReconsent=false&geolocation=BR%3BSP; OptanonAlertBoxClosed=2022-01-19T14:54:52.212Z; prevPageType=platform_game_list; s_getNewRepeat=1642604092542-New; s_lv_undefined=1642604092543; utag_main=v_id:017e72c3e65a003d7a5269d74fa405072001e06a0086e$_sn:1$_se:8$_ss:0$_st:1642605895634$ses_id:1642602948187%3Bexp-session$_pn:4%3Bexp-session$vapi_domain:gamespot.com; RT="z=1&dm=gamefaqs.gamespot.com&si=7e69f45d-c2ec-4c88-bd74-8c5283d253c0&ss=kylndrun&sl=4&tt=hst&bcn=%2F%2F17de4c1d.akstat.io%2F&ld=oo05&ul=osjk"',
    'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': "Windows",
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent':' Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
}


/**
 * Função que formata o path da página para ser usado como 
 * nome do arquivo
 * 
 * @param {*} texto a url da pagina solicitada
 * @returns String
 */
const slug = (texto) => {
    return texto.toString().toLowerCase().trim() // transforma texto para caixa baixa e remove espaços nas extremidades do texto
        .replace(/\s+/g,           '-')       // substitui espaços por hífen
        .replace(/[áàäâã]/g,       'a')       // substitui caracteres especiais á à ä â ã por a
        .replace(/[éèëê]/g,        'e')       // substitui caracteres especiais é è ë ê  por e
        .replace(/[íìîï]/g,        'i')       // substitui caracteres especiais í ì î ï por i
        .replace(/[óòöôõ]/g,       'o')       // substitui caracteres especiais ó ò ö ô õ por o
        .replace(/[úùüû]/g,        'u')       // substitui caracteres especiais ú ù ü û por u
        .replace(/ñ/g,             'n')       // substitui caracteres especiais ñ por n
        .replace(/ç/g,             'c')       // substitui caracteres especiais ç por c
        .replace(/[^\a-z0-9\-]+/g, '' )       // exclui caracteres que não seja alfanumérico
        .replace(/\-\-+/g,         '-')       // substitui mutiplos hífens por hífen simples
}


/**********************************************
* método para armazenar os dados em disco
* 
* @param {*} data o html que será escrito em disco
* @param {*} filename nome do arquivo que foi gerado a partir do path da página
* @returns Promise
************************************************/
const writeToFile = (data, filename) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, (error) => {
            if(error){
                reject(error)
                return //return para que não continue executando
            }
            resolve(true)
        })
    })
}


/**********************************************
* método que recupera a informação se ela estiver armazenada 
* em cache
* 
* @param {*} filename nome do arquivo que foi gerado a partir do path da página
* @returns Promise
************************************************/
const readFromFile = (filename) => {
    return new Promise((resolve) => {
        fs.readFile(filename, 'utf-8', (error, contents) => {
            if(error){
                console.log('*** readFromFile', error)
                resolve(null) //retorna null caso não haja nenhum arquivo com o nome informado
            }
            resolve(contents)
        })
    })
}


const getPage = (path) => {  
    const url = `${BASE_URL}${path}`
    const options = {
        headers: browserHeaders
    }
    return axios.get(url, options).then(response => response.data)  //response.data retorna só o html
}


/**
 * Verifica se a página solicitada já está armazenada em 
 * cache, caso não esteja, armazena ela em disco
 * 
 * @param {*} path url da página
 * @returns Promise
 */
const getcachedPage = (path) => {
    const filename = `cache/${slug(path)}.html`

    return new Promise (async (resolve) => {
        const cachedHTML = await readFromFile(filename)
        
        if(!cachedHTML){
            const html = await getPage(path)

            await writeToFile(html, filename)
            resolve(html)
            return
        }   
        resolve(cachedHTML)
    })
}


/**
 * Armazena em disco os dados buscados na página
 * 
 * @param {*} data Objeto contendo os dados recuperados da página
 * @param {*} path caminho do arquivo onde os dados serão salvos
 * @returns Promise
 */
 const saveData = (data, path) => {

    return new Promise(async (resolve) => {
        if(!data || data.length === 0){
            return resolve(true)
        }

        const dataToStore = JSON.stringify({data: data}, null, 2) //converte o objeto passado em uma string; null pq eu nao quero fazer nenhuma manipulação nos meus dados; 2 é o tamanho da identação
        const created = await writeToFile(dataToStore, path)
        resolve(true)
    })
}


/**
 * Faz a busca dos elementos desejados dentro da página
 * 
 * @param {*} html html da pagina
 * @returns Promise
 */
const getPageItems = (html) => {
    const $ = cheerio.load(html)

    return new Promise((resolve, reject) => {
        //esse seletor eu escolhi aleatoriamente lá do html da página
        const selector = '#content > div.post_content.row > div > div:nth-child(1) > div.body > table > tbody > tr'
        const games =[]

        $(selector).each((i, element) => {
            const a = $('td.rtitle > a', element)   //retorna todos os table datas 
            const title = a.text()
            const href = a.attr('href')
            const id = href.split('/').pop()    //separa a string nas '/' e gera um array com todas as partes, retorna o ultimo elemento do array

            games.push({id, title, path: href})
        })
        resolve(games)
    })
}


const getAllPages = async (start, finish) => {
    let page = start

    do {
        const path = `/n64/category/999-all/page-2?page=${page}`

        await getcachedPage(path)
            .then(getPageItems)
            .then(data => saveData(data, `./db-${page}.json`))
            .then(console.log)
            .catch(console.error)

        page++
    } while(page < finish)
}

getAllPages(0, 3)
