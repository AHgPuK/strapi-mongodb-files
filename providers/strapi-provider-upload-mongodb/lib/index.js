'use strict';

/**
 * Module dependencies
 */
//const Crypto = require('crypto');
const Path = require('path');
const modulesDir = Path.join(process.cwd(), 'node_modules');
let modulesPath = '';

if (__dirname.indexOf(modulesDir) == -1)
{
	modulesPath = `${modulesDir}/`;
}

// Public node modules.
const Promise = require(modulesPath + 'bluebird');

const Deferred = function () {

	let f, r = null;

	const promise = new Promise(function (fulfill, reject) {

		f = fulfill;
		r = reject;

	})

	promise.fulfill = f;
	promise.reject = r;

	return promise;
}

// function niceHash(buffer) {
// 	return Crypto
// 	.createHash('sha256')
// 	.update(buffer)
// 	.digest('base64')
// 	.replace(/=/g, '')
// 	.replace(/\//g, '-')
// 	.replace(/\+/, '_');
// }

const getFileId = function (file) {
	return file.hash;
}

const getGridFSBucket = function (config) {

	const conn = strapi.admin.models.administrator.base.connections[0];
	const gridFSBucket = new GridFSBucket(conn.db, config.collectionName);

	return gridFSBucket;
}

// file struct
// {
//   "tmpPath": "C:\\Users\\Homeuser\\AppData\\Local\\Temp\\upload_20fa5c6da2888890d632046a74a9b6c6",
//   "name": "iptv.png",
//   "sha256": "KDqT0oCgAiX14RdXARGLieyUq2o5V4PgoH8VyD2UUEo",
//   "hash": "d802037836ca46a4b7526713d76e7f1b",
//   "ext": ".png",
//   "buffer": {
//     "type": "Buffer",
//     "data": [137, 80, 78, 71, ..., 13, 10, 26, 10, ]
//   },
//   "mime": "image/png",
//   "size": "294.56"
// }

const MongoDB = require(modulesPath + 'mongodb');
const GridFSBucket = MongoDB.GridFSBucket;


/* eslint-disable no-unused-vars */
module.exports = {
	provider: 'MongoDB',
	name: 'MongoDB files',

	// auth: {
	// 	collectionName: {
	// 		label: 'GridFs Collection name',
	// 		type: 'text',
	// 	},
	// },

	init: (config) => {

		config.collectionName = config.collectionName || 'fs';

		return {
			upload: (file) => {
				const uploadDir = config.mongoDbFilesUploadDir || 'files';

				return Promise.resolve()
				.then(async function () {

					const gridFSBucket = getGridFSBucket(config);
					file.name = file.name + file.ext;

					const count = (await gridFSBucket.find({
						filename: file.name,
					}).toArray()).length;

					if (count > 0)
					{
						throw new Error(`The file ${file.name} already exists`);
					}

					const uploadStream = gridFSBucket.openUploadStreamWithId(getFileId(file), file.name, {
						contentType: file.mime,
					});

					const promise = Deferred();

					uploadStream.once('finish', function () {

						file.url = `/${uploadDir}/${file.name}`;

						strapi.log.info(`${file.url} uploaded`);

						promise.fulfill();
					});

					uploadStream.once('error', function (err) {
						promise.reject(err);
					})

					uploadStream.end(file.buffer);

					return promise;
				})

			},

			delete: async (file) => {

				const gridFSBucket = getGridFSBucket(config);

				const result = (await gridFSBucket.find({
					filename: file.name,
				}).toArray());

				const id = result && result[0] && result[0]._id || null;

				return gridFSBucket.delete(id);
			}
		};
	}
};
