const { knex } = require('./index');

const containersModel = {
	getSchemaContainers: async function ({
		schemaId,
		limit = 100,
		offset = 0,
		trx = knex,
	}) {
		return trx('container_schema')
			.select(
				'container_schema.id',
				'container_schema.version',
				'container_schema.added_time as addedTime',
				'services.name as serviceName'
			)
			.leftJoin('schema', 'schema.id', 'container_schema.schema_id')
			.leftJoin('services', 'services.id', 'schema.service_id')
			.where('container_schema.schema_id', '=', schemaId)
			.orderBy('container_schema.added_time')
			.offset(offset)
			.limit(limit);
	},

	getSchemaContainerCount: async function ({ schemaId, trx = knex }) {
		const result = await trx('container_schema')
			.count('container_schema.id', { as: 'cnt' })
			.where('container_schema.schema_id', '=', schemaId)
			.andWhere('container_schema.version', '<>', 'latest');

		return result[0].cnt;
	},

	isDev: async function ({ schemaId, trx = knex }) {
		const result = await trx('container_schema')
			.count('container_schema.id', { as: 'cnt' })
			.where('container_schema.schema_id', '=', schemaId)
			.andWhere('container_schema.version', '=', 'latest');

		return Boolean(result[0].cnt);
	},
};

module.exports = containersModel;
