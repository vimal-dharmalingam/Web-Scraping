const puppeteer = require('puppeteer'); 
const fs = require('fs');

(async () => { 
	// Initiate the browser 
	const browser = await puppeteer.launch({headless:false}); 
	 
	// Create a new page with the default browser context 
	const page = await browser.newPage(); 
 
	// Go to the target website 
	await page.goto('https://www.target.com/store-locator/store-directory'); 
 
	// Get pages HTML content 
	 const locations =  await getLinks(page);
     let shops = [];
     for(let obj of locations){
        await page.goto(obj['link']); 
        let data =await getLinks(page)
        shops = [...shops, ...data];
     }
     const shop_details=[]
     for (const shop of shops) {
        await page.goto(shop['link']); 
        let shop_detail = await getStoreDetails(page);
        shop_detail.url= shop['link']
        await page.goto(shop_detail['map_url'],{
            waitUntil: 'networkidle0',
          });
        try { 
            await page.waitForNavigation({ timeout: 3000  });//waitUntil: 'networkidle0'
        }
        catch(exception)
        {
            await page.reload()
        }
        let url = await page.evaluate(currentUrl);
        let obj = getLocation(url);
        shop_detail.lat = obj.lat;
        shop_detail.long= obj.long;
        delete shop_detail.map_url;
        shop_details.push(shop_detail);
     }
    
    fs.writeFileSync('shops_details.json',JSON.stringify(shop_details),'utf-8');

    console.log(shop_details)
    
	await browser.close(); 
})();


const getLinks=async (page)=>{
    return await page.evaluate(()=> { 
        let h1 = document.querySelector('h1');
        if(h1)
        {
          let element =  h1.parentElement.parentElement.lastElementChild;
          return [...element.querySelectorAll('a')].map(a=>{ return {'loc': a.innerText, 'link': a.href}});
        }
        return [];
       });
}

const getStoreDetails=async (page)=>{
    return await page.evaluate(()=> { 
        let h1_text = document.querySelector('h1')?.innerText??'';
        let h2 = [...document.querySelectorAll('h2')].find(ele=>ele.innerText=='Store info');
        if(h2)
        {
            let element = h2.parentElement.parentElement.nextSibling;
            let address = element.children[1]?.firstChild;
            if(address)
            {
                return {'store_name': h1_text, 'address':address.innerText, 'map_url':address.href };
            }
        }
        return {};
       });
}

const currentUrl = () => {
    // get currect url.
    return window.location.href;
  }

const getLocation = (url) => {
    // Regex for Read Lat and Long
    var regex = new RegExp('@(.*),(.*),');
    var lat_long_match = url.match(regex);
    var lat = lat_long_match?.[1];
    var long = lat_long_match?.[2];
    return {lat,long}
}


// anonimus testing purpose

(async () => { 
	// Initiate the browser 
	const browser = await puppeteer.launch({headless:true}); 
	 
	// Create a new page with the default browser context 
	const page = await browser.newPage(); 
 
	// Go to the target website 
	await page.goto('https://www.target.com/store-locator/store-directory'); 

    console.log(await page.content())
    
	await browser.close(); 
});