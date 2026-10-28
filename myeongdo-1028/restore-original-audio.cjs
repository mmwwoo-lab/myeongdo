// Restore the complete MP3 files from small, versioned binary source chunks.
// No synthesis service or temporary provider URL is needed at deployment time.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,manifest=require('./audio-source/manifest.json');
for(const [name,record] of Object.entries(manifest)){
 const bytes=Buffer.concat(record.chunks.map(chunk=>fs.readFileSync(path.join(root,chunk))));
 if(bytes.length!==record.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==record.sha256)throw Error('Audio integrity check failed: '+name);
 const dest=path.join(root,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
}
console.log('Restored and verified '+Object.keys(manifest).length+' complete original recital MP3 files.');
