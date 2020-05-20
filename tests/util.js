
const {
  DynamoDbTable,
  DynamoDbSchema,
} = require('@aws/dynamodb-data-mapper');

const equal = require('fast-deep-equal');

const Table = require('../src/table');
const Entity = require('../src/entity');

const { clearCache } = require('../src/entity-index');

const TABLE = 'doto';
const REGION = 'eu-west-1';

Table.setDefault(TABLE, {
  dynamodb: {
    region: REGION,
  },
});

const table = Table.default;

async function clear() {
  clearCache();
  const { Items } = await table.client.scan({
    TableName: TABLE,
    ProjectionExpression: '#id,#kt',
    ExpressionAttributeNames: {
      '#id': '$id',
      '#kt': '$kt',
    },
  }).promise();
  await table.batchDelete(Items.map(item => ({
    [DynamoDbTable]: table.name,
    [DynamoDbSchema]: {
      $id: {
        type: 'String',
        keyType: 'HASH',
      },
      $kt: {
        type: 'String',
        keyType: 'RANGE',
      },
    },
    $id: item.$id.S,
    $kt: item.$kt.S,
  })));
}

async function validateRows(expected, message) {
  const { Items } = await table.client.scan({
    TableName: TABLE,
  }).promise();
  if (!equal(Items, expected)) {
    console.log('Rows should be: ', JSON.stringify(Items, null, 2));
    console.log(message || 'Not equals to expected');
  }
}

async function validateObj(item, expected, message) {
  if (item instanceof Entity) {
    item = item.toJSON();
  }
  if (!equal(item, expected)) {
    console.log(message || 'Not equals to expected');
  }
}


module.exports = {
  Table,
  clear,
  validateRows,
  validateObj,
};
