const fetch = require('node-fetch');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { parseString } = require('xml2js');

async function fetchData() {
  try {
    const response = await fetch('https://it-delta.ru./local/docs/yandex_not_sku.xml');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const xmlData = await response.text();
    
    const parsedData = await parseXmlData(xmlData);

    return parsedData.slice(0, 10);
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

function parseXmlData(xmlData) {
  return new Promise((resolve, reject) => {
    parseString(xmlData, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const offers = result && result.yml_catalog && result.yml_catalog.shop[0].offers[0].offer;
        const data = offers.map(offer => {
          return {
            categoryName: offer.param
            .filter(param => param.$.name === 'Категории')
            .map(param => param._.trim())[0],
            productName: offer.name[0],
            productLink: offer.url[0],
            productPrice: offer.price[0],
            productDescription: offer.description[0],
            country: offer.country_of_origin[0]
          };
        });

        resolve(data);
      }
    });
  });
}


async function writeCsv(data) {
  const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
      { id: 'categoryName', title: 'Наименование категории' },
      { id: 'productName', title: 'Наименование товара' },
      { id: 'productLink', title: 'Ссылка на товар' },
      { id: 'productPrice', title: 'Цена товара' },
      { id: 'productDescription', title: 'Описание товара' },
      { id: 'country', title: 'Страна' }
    ],
  });

  try {
    await csvWriter.writeRecords(data);
    console.log('CSV файл успешно создан');
  } catch (error) {
    console.error('Ошибка записи CSV файла:', error);
    throw error;
  }
}

(async () => {
  try {
    const data = await fetchData();
    await writeCsv(data);
  } catch (error) {
    console.error('Ошибка:', error);
  }
})();
