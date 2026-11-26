import{api}from'./core.js';

Object.defineProperty(window,'DB',{
value:Object.freeze({
getProfile:api.getProfile,
getPoems:api.getPoems,
getPoem:api.getPoem,
getRatings:api.getRatings,
addRating:api.addRating
}),
writable:false,
configurable:false
});
