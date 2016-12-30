'use strict';
let AsyncStack = require('../lib/async-stack');

function first(stack, msg){
    setTimeout(function(){
        console.log('first done');
        stack.setVar('firstResultValue', `${msg} world`);
        stack.done();
    }, 2000);
}

function second(stack, firstResult) {
    setTimeout(function(){
        stack.done("this is second result");
    }, 1000);
}

function third(stack, firstResult, secondResult) {
    console.log(firstResult, secondResult);
    setTimeout(function(){
        stack.done("this is third result");
    }, 1000);
}


let stack = new AsyncStack();
stack.await(first, 'hello');
stack.await(second, ':firstResultValue');
stack.await(third, ':firstResultValue', '?');
stack.done((stack)=>{
   console.log(stack.result());
});
stack.run();


// call results
//------------------------------------------------------------------------------
//first done
//hello world this is second result
//[ null, [ 'this is second result' ], [ 'this is third result' ] ]
