import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAsset,allowNavigation} from '../desktop/policy.js';
test('resolves only bundled assets for the app origin',()=>{
 const root='C:/app/dist';
 assert.equal(resolveAsset('fcb://app/',root).replaceAll('\\','/'),'C:/app/dist/index.html');
 assert.equal(resolveAsset('fcb://app/assets/main.js',root).replaceAll('\\','/'),'C:/app/dist/assets/main.js');
 for(const url of ['https://example.com/','fcb://evil/index.html','fcb://app/%2e%2e%2fsecret','fcb://app/%2e%2e%5csecret','fcb://app/C:%5csecret','fcb://user:pass@app/index.html','fcb://app/%00secret']){
  assert.throws(()=>resolveAsset(url,root),undefined,url);
 }
});
test('navigation stays inside the application entry point',()=>{
 assert.equal(allowNavigation('fcb://app/index.html'),true);
 assert.equal(allowNavigation('fcb://app/'),true);
 for(const url of ['https://example.com','file:///C:/Windows/win.ini','javascript:alert(1)','fcb://app/other.html','fcb://app/index.html?x=1','fcb://evil/'])assert.equal(allowNavigation(url),false,url);
});
