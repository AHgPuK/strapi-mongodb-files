const {GridFSBucket} = require('mongodb');
const {extensions: Extensions} = require('libmime/lib/mimetypes');

module.exports = {
	fetchFile: function (ctx) {

		const conn = strapi.admin.models.administrator.base.connections[0];
		const gridFSBucket = new GridFSBucket(conn.db);

		const {fileName, fileExt} = ctx.params;

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
