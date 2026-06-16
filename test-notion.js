const { NotionAPI } = require('notion-client');

async function testNotion() {
  const notion = new NotionAPI();
  const pageId = '2bcdc2d8febf8034b58be40febbc3c89';
  console.log('Testing page ID:', pageId);
  try {
    const recordMap = await notion.getPage(pageId);
    console.log('Success! Keys:', Object.keys(recordMap));
  } catch (error) {
    console.error('Error fetching:', error.message);
  }
}

testNotion();
