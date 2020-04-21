const Path = require('path');
const modulesDir = Path.join(process.cwd(), 'node_modules');
let modulesPath = '';

if (__dirname.indexOf(modulesDir) == -1)
{
	modulesPath = `${modulesDir}/`;
}

const {GridFSBucket} = require(modulesPath + 'mongodb');
const {extensions: Extensions} = require(modulesPath + 'libmime/lib/mimetypes');

strapi.app.use(async function (ctx, next) {

  const config = strapi.plugins.upload.config;
  const uploadDir = config.providerOptions && config.providerOptions.mongoDbFilesUploadDir || 'files';

  const {method, url} = ctx.req;

  if (method != 'GET')
  {
    return await next();
  }

  if (url.indexOf('/' + uploadDir + '/') != 0)
  {
    return await next();
  }

  const fileName = url.replace('/' + uploadDir + '/', '').split('?')[0];

  const conn = strapi.admin.models.administrator.base.connections[0];
  const gridFSBucket = new GridFSBucket(conn.db);

  const downloadStream = gridFSBucket.openDownloadStreamByName(fileName);

  const fileExt = Path.extname(fileName).replace('.', '');

  const contentType = Extensions[fileExt.toLowerCase()];

  if (contentType)
  {
    ctx.append('Content-Type', contentType);
  }

  ctx.body = downloadStream.on('error', function (err) {

    // Suppress long stacktrace
    delete err.stack;

  });
})
