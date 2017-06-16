'use strict';

class AsyncStack {
    constructor() {
        this.passCount = 0;
        this.error = null;
        this.result = [];
        this.failFn = null;
        this.failFnArgs = [];
        this.doneFn = null;
        this.doneFnArgs = [];
        this.stack = [];
        this.stackArgs = [];
        this.stackWaitType = [];
        this.sandbox = null;
        this.variables = {};
        this.prependStack = [];
        this.prependStackArgs = [];
        this.prependStackWaitType = [];
        this.stackFailFn = null;
        this.stackFailFnArgs = [];
    }

    //--------------------------------------------------------------------------
    // Public Methods
    //--------------------------------------------------------------------------

    /**
     * Set variable for stack
     * @param key
     * @param value
     */
    setVar(key, value) {
        this.variables[key] = value;
    }

    /**
     * Get variable for stack
     * @param key
     * @returns {null}
     */
    getVar(key) {
        return this._getDescendantProp(this.variables, key);
    }

    /**
     * Delete variable
     * @param key
     */
    delVar(key) {
        delete this.variables[key];
    }

    /**
     * Push await stack
     * @param fn
     * @returns {WorkStack}
     */
    await(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error('not available type');
        }

        this.stack.push(fn);
        this.stackArgs.push(args);
        this.stackWaitType.push(true);
        return this;
    }

    /**
     * Run async stack
     * @param stack
     */
    pass(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error('not available type');
        }

        this.stack.push(fn);
        this.stackArgs.push(args);
        this.stackWaitType.push(false);
        return this;
    }

    /**
     * Mapping result variables with names
     * @param varName
     * @returns {AsyncStack}
     */
    setResultsName(...varName) {
        this.stack.push(function (stack, ...results) {
            for (let i = 0; i < results.length, i < varName.length; i++) {
                stack.setVar(varName[i], results[i]);
            }
            stack.done();
        });
        this.stackArgs.push(null);
        return this;
    }

    /**
     * push stack in stack
     * @param stack
     */
    _prepend(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error('not available type');
        }

        this.prependStack.push(fn);
        this.prependStackArgs.push(args);
        this.prependStackWaitType.push(true);
        return this.sandbox;
    }

    /**
     * push stack in stack
     * @param stack
     */
    _prependPass(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error('not available type');
        }

        this.prependStack.push(fn);
        this.prependStackArgs.push(args);
        this.prependStackWaitType.push(false);
        return this.sandbox;
    }


    //--------------------------------------------------------------------------
    // Private Methods
    //--------------------------------------------------------------------------

    /**
     * Run await stack
     * @param args
     * @returns {*}
     */
    run(...args) {

        if (this.error !== null) {
            this.onError();
            return this.error;
        }
        //스택길이 체크
        else if (this.stack.length == 0) {
            this.doneFnArgs = this.doneFnArgs.concat(args);
            this.onDone();
            return false;
        }

        let fn = this.stack.shift();
        let fnArgs = this.stackArgs.shift();
        fnArgs = this._checkStackTemplateArguments(fnArgs, args);
        let isWait = this.stackWaitType.shift();

        let params = fnArgs[0] === undefined ? args : fnArgs.concat(args);

        this.sandbox = this.getSandbox();
        try {
            fn.apply(this, [this.sandbox].concat(params));
            if(!isWait && this.stack && !!this.stack[0] && !this.stackWaitType[0]){
                this.passCount++;
                this.run();
            }
        } catch (e) {
            console.error('stack error', e);
            this.error = '500';
            this.onError();
        }
    }

    //이전 스택이 pass 형태고 이번스택이 await 상태라면 pass가 다되었는지 확인해야한다.

    /**
     * convert template argument
     * @returns {T}
     * @private
     */
    _checkStackTemplateArguments(fnArgs, args = []) {
        let index = 0,
            variableName,
            variable,
            i = 0;

        let len = 0;
        if(!!fnArgs){
            len = fnArgs.length;
        }

        for (; i < len; i++) {
            if (fnArgs[i] === '?') {
                fnArgs[i] = args[index];
                index++;
            } else if (typeof fnArgs[i] === 'string' && fnArgs[i].indexOf(':') === 0) {
                variableName = fnArgs[i].substr(1, fnArgs[i].length - 1);
                variable = this.getVar(variableName);
                if (this.getVar(variableName) !== undefined) {
                    fnArgs[i] = variable;
                }
            }
        }

        return fnArgs;
    }

    _getDescendantProp(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    /**
     * set callback when all stack finished
     * @param fn
     * @returns {WorkStack}
     */
    done(fn, ...args) {

        if (typeof fn !== 'function') {
            throw new Error('not available type');
        }

        this.doneFnArgs = args.length > 0 ? args : [];
        this.doneFn = fn;
        return this;
    }


    /**
     * set callback when stack has error
     * @param fn
     * @returns {WorkStack}
     */
    fail(fn, ...args) {

        if (typeof fn !== 'function') {
            throw new Error('not available type');
        }

        this.failFnArgs = args.length > 0 ? args : [];
        this.failFn = fn;
        return this;
    }

    /**
     * Run when all stack finished
     */
    onDone() {

        if (!!this.doneFn) {
            //done으로등록된 콜백이 AsyncStack 이라면 done 처리한다
            if (!!this.doneFn.__instance &&
                this.doneFn.__instance !== this &&
                //this.doneFn이 인자값으로 전달된 stack
                this.doneFn.__instance instanceof AsyncStack) {

                this.doneFn.done.apply(this, this.doneFnArgs);
                this.discard();
                return;
            }

            this.doneFn.apply(this, [this.sandbox].concat(this.doneFnArgs));
            //폐기
            this.discard();
        }
    }

    /**
     * Run when stack has error
     */
    onError() {

        if (this.stackFailFn !== null && typeof this.stackFailFn === 'function') {
            this.stackFailFnArgs = this._checkStackTemplateArguments(this.stackFailFnArgs);
            this.stackFailFn.apply(null, this.stackFailFnArgs);
            this.stackFailFn = null;
        }

        if (this.failFn !== null && typeof this.failFn === 'function') {
            this.failFnArgs = this._checkStackTemplateArguments(this.failFnArgs);
            this.failFn.apply(null, [this.error, this.sandbox].concat(this.failFnArgs));
            //폐기
            this.discard();
            this.failFn = null;
        }
    }

    _save(...args) {
        if(!this.prependStack){
            console.error('no stack');
            return;
        }
        else if (this.prependStack.length > 0) {
            this.stack = this.prependStack.concat(this.stack);
            this.stackArgs = this.prependStackArgs.concat(this.stackArgs);
            this.stackWaitType = this.prependStackWaitType.concat(this.stackWaitType);
            this.prependStack = [];
            this.prependStackArgs = [];
        }

        let result = args;
        if (args.length === 0)  {
            result = null;
        }

        this.result.push(result);
        if(this.passCount > 0){
            this.passCount--;
        }else{
            this.run(...args)
        }
    }

    _finish(...args) {
        let result = args;
        if (args.length === 0) {
            result = null;
        }
        this.result.push(result);
        this.doneFnArgs = this.doneFnArgs.concat(result);
        this.onDone();
    }

    /**
     * 현재까지 실행완료된 wait 스택의 결과값
     * @returns {null|Array}
     */
    getResult() {
        return this.result;
    }

    stop(error) {
        this._onError(error);
    }

    discard() {
        this.passCount = null;
        this.error = null;
        this.result = null;
        this.failFn = null;
        this.failFnArgs = null;
        this.doneFn = null;
        this.doneFnArgs = null;
        this.stack = null;
        this.sandbox = null;
        this.stackArgs = null;
        this.variables = null;
        this.prependStack = null;
        this.prependStackArgs = null;
        this.prependStack = null;
        this.prependStackArgs = null;
        this.prependStackWaitType = null;
        this.stackFailFn = null;
        this.stackFailFnArgs = null;

        delete this.passCount;
        delete this.error;
        delete this.result;
        delete this.failFn;
        delete this.failFnArgs;
        delete this.doneFn;
        delete this.doneFnArgs;
        delete this.stack;
        delete this.sandbox;
        delete this.stackArgs;
        delete this.variables;
        delete this.prependStack;
        delete this.prependStackArgs;
        delete this.prependStack;
        delete this.prependStackArgs;
        delete this.prependStackWaitType;
        delete this.stackFailFn;
        delete this.stackFailFnArgs;
    }

    _onError(errorMsg) {
        this.error = errorMsg;
        this.onError();
    }

    _onFail(fn, ...args){
        if (typeof fn !== 'function') {
            throw new Error('not available type');
        }

        this.stackFailFn = fn;
        this.stackFailFnArgs = args.length > 0 ? args : [];
        return this;
    }

    _removeDone(){
        this.doneFn = null;
        this.doneFnArgs = [];
    }

    getSandbox() {
        return {
            setVar: this.setVar.bind(this),
            getVar: this.getVar.bind(this),
            done: this._save.bind(this),
            finish: this._finish.bind(this),
            error: this._onError.bind(this),
            fail : this._onFail.bind(this),
            result: this.getResult.bind(this),
            pass: this._prependPass.bind(this),
            await: this._prepend.bind(this),
            setResultsName: this.setResultsName.bind(this),
            removeDoneCallback : this._removeDone.bind(this),
            __instance: this,
        }
    }
}


module.exports = AsyncStack;


