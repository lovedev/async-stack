'use strict';
let AsyncStack = require('../lib/async-stack');

function stackInStack(stack){
    console.log('stack in stack');
    stack.await(second, ':firstResultValue');
    stack.await(third);
    stack.fail((msg)=>{
        console.log('error in stack', msg)
    }, ':firstResultValue')
    stack.done();
}

function first(stack, msg){
    setTimeout(function(){
        console.log('first done');
        stack.setVar('firstResultValue', `${msg} world`);
        stack.done();
    }, 2000);
}

function second(stack, firstResult) {
    setTimeout(function(){
        console.log(firstResult);
        console.log('second done');
        stack.error('error!!!! all stack stop');
    }, 1000);
}

function third(stack, secondResult){
    console.log(secondResult);
    console.log('third done');
    stack.done('call', 'complete', 'function');
}

let stack = new AsyncStack();
stack.await(first, 'hello');
stack.await(stackInStack);
stack.done((stack)=>{
   console.log(stack.result());
});
stack.fail((error, stack)=>{
    console.log('main stack error is detected');
});
stack.run();

/*call results
------------------------------------------------------------------------------
first done
stack in stack
hello world
second done
error!!!! all stack stop
*/