'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const Promise = require('bluebird');

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

const getFileId = function (file) {
	return file.sha256 + '/' + file.hash;
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

const MongoDB = require('mongodb');
const GridFSBucket = MongoDB.GridFSBucket;

const IMAGES_PATH = '/images';

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

				return Promise.resolve()
				.then(async function () {

					const gridFSBucket = getGridFSBucket(config);

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

						file.url = `${IMAGES_PATH}/${file.name}`;

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

			delete: (file) => {

				return Promise.resolve()
				.then(function () {

					const gridFSBucket = getGridFSBucket(config);

					return gridFSBucket.delete(getFileId(file))
				})
			}
		};
	}
};
