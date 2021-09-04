const Plugin = async function () {

  while (true) {
    if (strapi.isLoaded) {
      break;
    }

    await new Promise(function (f) {
      setTimeout(f, 500);
    })
  }

  const Path = require('path');
  const URL = require('url');
  let LRU = null;
  let isLruEnabled = true;
  let lruCache = null;

  const modulesDir = Path.join(process.cwd(), 'node_modules');
  let modulesPath = '';

  if (__dirname.indexOf(modulesDir) == -1)
  {
    modulesPath = `${modulesDir}/`;
  }

  const {GridFSBucket} = require(modulesPath + 'mongodb');

  const initLRU = function (config) {

    if (LRU == null)
    {
      try
      {
        LRU = require('lru-cache');
      }
      catch (e)
      {
        console.error(e);
        LRU = null;
        return false
      }
    }

    try
    {
      lruCache = new LRU(config);
    }
    catch (e)
    {
      console.error(e);
      LRU = null;
      return false
    }

    return true;
  }

  const removeListeners = function (stream, events) {
    events.map(function (event) {
      stream.removeAllListeners(event);
    })
  }

  const events = ['data', 'error', 'end'];

  const getFile = function (gridFSBucket, fileName) {

    return new Promise(function (fulfill, reject) {

      const file = {
        error: '',
        contentType: '',
        content: '',
      }

      const chunks = [];
      const downloadStream = gridFSBucket.openDownloadStreamByName(fileName);

      downloadStream.on('data', function (chunk) {
        file.contentType = downloadStream.s.file.contentType || 'application/octet-stream';
        chunks.push(chunk);
      })

      downloadStream.on('end', function () {
        file.content = Buffer.concat(chunks);
        removeListeners(downloadStream, events);
        fulfill(file);
      })

      downloadStream.on('error', function (err) {
        removeListeners(downloadStream, events);
        // Suppress long stacktrace
        delete err.stack;

        fulfill({
          error: err.message
        })
      });

    })

  }

  strapi.app.use(async function (ctx, next) {

    const config = strapi.plugins.upload.config;
    const uploadDir = config.providerOptions && config.providerOptions.mongoDbFilesUploadDir || 'files';
    const readPreference = config.providerOptions && config.providerOptions.read || null;
    const lruConfig = config.providerOptions && config.providerOptions.lruConfig || null;

    if (lruConfig )
    {
      if (LRU == null)
      {
        if (isLruEnabled)
        {
          isLruEnabled = initLRU(lruConfig);
        }
      }
    }
    else
    {
      isLruEnabled = false;
    }

    const {method, url} = ctx.req;

    if (method != 'GET')
    {
      return await next();
    }

    if (url.indexOf('/' + uploadDir + '/') != 0)
    {
      return await next();
    }

    const parsed = URL.parse(url);
    const fileName = decodeURIComponent(Path.basename(parsed.pathname));

    const conn = (strapi.admin.models.administrator || strapi.admin.models.permission).base.connections[0];
    const gridFSBucket = new GridFSBucket(conn.db, {
      readPreference: readPreference,
    });

    if (!isLruEnabled)
    {
      const downloadStream = gridFSBucket.openDownloadStreamByName(fileName);

      downloadStream.once('data', function (chunk) {
        ctx.append('Content-Type', downloadStream.s.file.contentType || 'application/octet-stream');
      })

      ctx.body = downloadStream.on('error', function (err) {
        downloadStream.removeAllListeners('data');
        // Suppress long stacktrace
        delete err.stack;
      });

      return;
    }

    let file = lruCache.get(fileName);

    if (!file)
    {
      file = await getFile(gridFSBucket, fileName);

      // if (!file)
      // {
      //   return ctx.response.notFound();
      // }

      if (file.error)
      {
        return ctx.response.notFound(null, file.error);
      }

      lruCache.set(fileName, file);
    }

    ctx.append('Content-Type', file.contentType || 'application/octet-stream');
    ctx.body = file.content;
    // strapi.log.debug('GET', ctx.url)
  })

  strapi.log.info('MongoDB Files plugin is loaded')
}

setTimeout(Plugin, 0);
