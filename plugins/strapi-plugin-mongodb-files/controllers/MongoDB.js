const Path = require('path');
const modulesDir = Path.join(process.cwd(), 'node_modules');
let modulesPath = '';

if (__dirname.indexOf(modulesDir) == -1)
{
	modulesPath = `${modulesDir}/`;
}

const {GridFSBucket} = require(modulesPath + 'mongodb');
const {extensions: Extensions} = require(modulesPath + 'libmime/lib/mimetypes');

module.exports = {
	fetchFile: function (ctx) {

		const uploadDir = strapi.config.mongoDbFilesUploadDir || 'files';

		const {fileName, fileExt, uploadDirFromRequest} = ctx.params;

		if (uploadDir != uploadDirFromRequest)
		{
			return;
		}

		const conn = strapi.admin.models.administrator.base.connections[0];
		const gridFSBucket = new GridFSBucket(conn.db);

		const downloadStream = gridFSBucket.openDownloadStreamByName(`${fileName}.${fileExt}`);
		const contentType = Extensions[fileExt.toLowerCase()];

		if (contentType)
		{
			ctx.append('Content-Type', contentType);
		}

		ctx.body = downloadStream.on('error', function (err) {

			// Suppress long stacktrace
			delete err.stack;

		});
	}
}
