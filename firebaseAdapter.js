var admin = require("firebase-admin");
var request = require("request");
var Rx = require('rxjs/Rx');


var serviceAccount = require("./secret.json"); // path to your firebase secret file
const dbUrl = 'https://YOUR DATABASE.firebaseio.com/';
const authId = 'YOUR DATABASE AUTH ID, different than api key';


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: dbUrl
});
var db = admin.database();
const success = {success: 1}
const fail = {success: 0}
const queryUrl = '.json?auth='+authId;
const shallowUrl = '&shallow=true';

const url = (home, child, shallow)=>{
	const urlPath = shallow ? queryUrl+shallowUrl : queryUrl;
	return !child ?  dbUrl+home+urlPath : dbUrl+home+'/'+child+urlPath;
}

const urlCatch = (home, child = false, shallow = false)=> {
	return new Promise((resolve, reject) => {
		request(url(home,child,shallow), (err, response,body) => {
			return err ? reject(err) : resolve(body);
		})
	})
}

module.exports = {
	post: (home, data) =>{
		var ref = db.ref(home)
		return new Promise ((resolve, reject)=>{
			ref.set(data,  
				(err)=>{err ? reject(err) : resolve(success);}
			);
		});
	},

	getAll:()=>{
		var ref = db;
		return new Promise ((resolve, reject)=>{
			ref.once("value", 
				(result) =>resolve(result.val()),
				(error)=>reject(error)
			);
		});
	},

	getId:(home)=>{
		var ref = db.ref(home);
		return new Promise ((resolve, reject)=>{
			ref.once("value", 
				(result) =>resolve(result.val()),
				(error)=>reject(error)
			);
		});
	},

	patch:(home, data)=>{
		var ref = db.ref(home)
		return new Promise((resolve, reject)=>{
			ref.update(data,
			  (err)=>{return err ? reject(err) : resolve(success)}
			);
		});
	},

	getIdChild:(home, child)=>{
		return new Promise((resolve, reject) => {
			urlCatch(home,child)
				.then((x)=> resolve(JSON.parse(x)))
				.catch((err)=> reject(err))
		})
	},

	patchChild:(home, child, data)=>{
		var ref = db.ref(home).child(child)
		return new Promise((resolve, reject)=>{
			ref.update(data,
			  (err)=>{return err ? reject(err) : resolve(success)}
			);
		});
	},

	deleteId:(home, child = null)=>{
		return new Promise((resolve, reject)=>{
			if (child){
				db.ref(home).child(child).remove((err)=>{
					return err ? reject(err) : resolve(success)
				});
			} else {
				db.ref(home).remove((err)=>{
					return err ? reject(err) : resolve(success)
				});
			}
		})
	},

	getKeys:(home, shallow=false)=>{
		let result = {}
		return new Promise((resolve, reject) => { 
			urlCatch(home, false, true).then(x=>{
				if (!!x) {
					subRoots = Object.keys(JSON.parse(x));
					if (shallow) {
						resolve(subRoots)
					} else {
					let currentRoot = ''
					return Rx.Observable.from(subRoots)
							.mergeMap(x=> Rx.Observable.fromPromise(urlCatch(home,x,true))
								.map(y=>{return {[x]:Object.keys(JSON.parse(y))}})
							)
							.do(y=>{return Object.assign(result, y)})
						.subscribe(x=>{console.log('x',x)},
							err=>reject(err),
							comp=>resolve(result)
						)	
					}
				} else {
					reject(Object.assign(fail, {error: "OBJECT_NOT_FOUND"}));
				}
			}).catch(err=>{
				reject(Object.assign(fail,{error: "OBJECT_NOT_FOUND"}, {desc:err}))
			})
		})
	}
}	
