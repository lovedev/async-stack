'use strict';

class AsyncStack {
    constructor() {
        this.passCount = 0;
        this.isWork = false;
        this.passStack = [];
        this.error = null;
        this.result = [];
        this.failFn = null;
        this.failFnArgs = [];
        this.doneFn = null;
        this.doneFnArgs = [];
        this.stack = [];
        this.sandbox = null;
        this.stackArgs = [];
        this.variables = {};
        this.prependStack = [];
        this.prependStackArgs = [];
    }

    //--------------------------------------------------------------------------
    // Public Methods
    //--------------------------------------------------------------------------

    /**
     *
     * @param key
     * @param value
     */
    setVar(key, value) {
        this.variables[key] = value;
    }

    /**
     *
     * @param key
     * @returns {null}
     */
    getVar(key) {
        return this.variables[key];
    }

    /**
     * make await stack
     * @param fn
     * @returns {WorkStack}
     */
    await(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error('not allowed await function');
        }

        this.stack.push(fn);
        this.stackArgs.push(args);
        return this;
    }

    /**
     * make non await stack (just run)
     * @param stack
     */
    pass(fn, ...args) {
        let stack = this.getSandBoxForPass();
        this.passCount++;
        fn.apply(this, [stack].concat(args));
        return this;
    }

    /**
     * get await-stack results
     * @returns {null|Array}
     */
    getResult() {
        return this.result;
    }

    /**
     * get pass-stack results
     * @returns {null|Array}
     */
    getPassResult() {
        return this.passStack;
    }

    /**
     * run when stack finished
     * @param fn
     * @returns {WorkStack}
     */
    done(fn, ...args) {
        this.isWork = false;
        if (typeof fn !== 'function') {
            throw new Error('not allowed done function');
        }

        this.doneFnArgs = args.length > 0 ? args : [];
        this.doneFn = fn;
        return this;
    }


    /**
     * run when stack has error
     * @param fn
     * @returns {WorkStack}
     */
    fail(fn, ...args) {
        this.isWork = false;
        if (typeof fn !== 'function') {
            throw new Error('not allowed fail function');
        }

        this.failFnArgs = args.length > 0 ? args : [];
        this.failFn = fn;
        return this;
    }

    stop(error) {
        this._onError(error);
    }

    //--------------------------------------------------------------------------
    // Private Methods
    //--------------------------------------------------------------------------

    /**
     * run stack
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
        let fnArgs = this._checkStackTemplateArguments(args);

        let params = fnArgs[0] === undefined ? args : fnArgs.concat(args);

        this.sandbox = this.getSandbox();
        try {
            this.isWork = true;
            fn.apply(this, [this.sandbox].concat(params));
        } catch (e) {
            console.error('stack error', e);
            this.error = '500';
            this.onError();
        }
    }

    /**
     * append with current stack
     * @param stack
     */
    _prepend(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error('not allowed await function');
        }

        this.prependStack.push(fn);
        this.prependStackArgs.push(args);
        return this;
    }


    /**
     * convert template argument
     * @returns {T}
     * @private
     */
    _checkStackTemplateArguments(args) {
        let fnArgs = this.stackArgs.shift();
        let index = 0,
            variableName,
            variable,
            i = 0,
            len = fnArgs.length;

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

    onDone() {
        if (this.isWork === true) {
            return;
        }

        //병렬로 실행중인 스택이 있다면 종료하지 않음
        if (this.passCount > 0) {
            return;
        }

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

    onError() {
        if (this.failFn !== null) {
            this.failFn.apply(null, [this.error, this.sandbox].concat(this.failFnArgs));
            //폐기
            this.discard();
            this.failFn = null;
        }
    }

    _save(...args) {
        this.isWork = false;
        if (this.prependStack.length > 0) {
            this.stack = this.prependStack.concat(this.stack);
            this.stackArgs = this.prependStackArgs.concat(this.stackArgs);
            this.prependStack = [];
            this.prependStackArgs = [];
        }

        let result = args;
        if (args.length === 0) {
            result = null;
        }
        this.result.push(result);
        this.run(...args)
    }

    _saveForPass(id, ...args) {
        this.passCount--;
        this.passStack[id] = args;

        if (this.passCount == 0) {
            this.sandbox = this.getSandbox();
            this.onDone();
        }
    }

    _finish(...args) {
        this.isWork = false;
        let result = args;
        if (args.length === 0) {
            result = null;
        }
        this.result.push(result);
        this.doneFnArgs = this.doneFnArgs.concat(result);
        //console.log(this.doneFnArgs);
        this.onDone();
    }

    _onError(error) {
        this.error = error;
        this.onError();
    }

    getSandBoxForPass() {
        let stackResult = null;
        let id = this.passStack.length;
        this.passStack.push(stackResult);
        return {
            _id: id,
            type: 'pass',
            setVar: this.setVar.bind(this),
            getVar: this.getVar.bind(this),
            pass: this.pass.bind(this),
            done: this._saveForPass.bind(this, id),
            error: this._onError.bind(this)
        }
    }

    getSandbox() {
        return {
            type: 'await',
            setVar: this.setVar.bind(this),
            getVar: this.getVar.bind(this),
            done: this._save.bind(this),
            finish: this._finish.bind(this),
            error: this._onError.bind(this),
            result: this.getResult.bind(this),
            pass: this.pass.bind(this),
            passResult: this.getPassResult.bind(this),
            await: this._prepend.bind(this),
            __instance: this,
        }
    }

    discard() {
        this.passCount = null;
        this.isWork = null;
        this.passStack = null;
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
    }
}

module.exports = AsyncStack;
