// Copyright (c) 2019 Clément Dandrieux
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const { expect, assert } = require('chai')
const EventEmitter = require('events')
const { PassThrough } = require('stream')
const http = require('http')
const sinon = require('sinon')
const Snapd = require('../src/index')


afterEach(() => {
    // Restore the default sandbox here
    sinon.restore()
})

describe('Snapd', () => {

    describe('Snapd->request', () => {

        it('should be a function', () => {
            const snap = new Snapd()
            expect(snap.request).to.be.a('function')
        })
        
        it('should return a promise', () => {
            const snap = new Snapd()
            expect(snap.request())
                .to.be.a('promise')
        })
        
        it('should reject on transfer error', function(done) {
            const snap = new Snapd()
            const response = new PassThrough()
            const request = new PassThrough()
            const error = new Error('Transfer error')
            sinon.replace(http, 'request', sinon.fake.returns(request))
         
         
            
            snap.request()
            .then(() => done(new Error('Should not succeed')))
            .catch(err => {
                try {
                    expect(err).to.eql(error)
                    done()
                } catch (error) {
                    done(error)
                }
            })
            http.request.getCall(0).lastArg(response)
            response.emit('error', error)
            response.end()
        })

        it('should convert the response to object', function(done) {
            const snap = new Snapd()
            const expected = { hello: 'world' }
            const response = new PassThrough()
            const request = new PassThrough()
            sinon.replace(http, 'request', sinon.fake.returns(request))
            response.write(JSON.stringify(expected))
            response.end()
         
         
            
            snap.request()
            .then(result => {
                expect(result).to.eql(expected)
                done()
            })
            http.request.getCall(0).lastArg(response)
        })

        it('should throw an error on invalid JSON response', (done) => {
            const snap = new Snapd()
            const response = new PassThrough()
            const request = new PassThrough()
            sinon.replace(http, 'request', sinon.fake.returns(request))
            response.write('Some invalid JSON')
            response.end()
         
         
            
            snap.request()
            .then(() => done(new Error('Should not resolve')))
            .catch(() => {
                done()
            })
            http.request.getCall(0).lastArg(response)
        })


        it('should override http method with last arg', function(done) {
            const snap = new Snapd()
            const expected = { hello: 'world' }
            const response = new PassThrough()
            const request = new PassThrough()
            sinon.replace(http, 'request', sinon.fake.returns(request))
            response.write(JSON.stringify({hello: 'world'}))
            response.end()
         
         
            
            snap.request('some-path', null, {method: 'POST'})
            .then(() => done())
            .catch(done)

            expect(http.request.getCall(0).args[0])
                .to.have.property('method', 'POST')

            http.request.getCall(0).lastArg(response)
        })

        it('should write second arg as request body', function(done) {
            const snap = new Snapd()
            const body = { hello: 'world' }
            const response = new PassThrough()
            const request = new PassThrough()

            let reqData = ''
            request.on('data', d => reqData+=d)
            request.once('end', () => {
                expect(reqData).to.eql(
                    JSON.stringify(body)
                )
            })

            sinon.replace(http, 'request', sinon.fake.returns(request))
            response.write(JSON.stringify({hello: 'world'}))
            response.end()
         
         
            
            snap.request('some-path', body)
            .then(() => done())
            .catch(done)

            http.request.getCall(0).lastArg(response)
        })

    })

    describe('Snapd->systemInfo', () => {

        it('should call request with corrects args', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.systemInfo()
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('system-info'))

        })

    })

    describe('Snapd->changes', () => {

        it('should call request with corrects args for a given id and options', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            const body = {hello: 'world'}
            const options = {method: 'POST'}

            snap.changes(0, body, options)
                .then(done)
                .catch(done)
            console.log(snap.request.getCall(0).args)
            assert(snap.request.calledWith('changes/0', body, options))

        })

        it('should call request with corrects args with no args provided', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.changes()
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('changes'))

        })

    })

    describe('Snapd->find', () => {

        it('should call request with corrects args', done => {
            const snap = new Snapd()

            const options = {}

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.find(options)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('find', options))

        })

    })

    describe('Snapd->list', () => {

        it('should call request with corrects args', done => {
            const snap = new Snapd()

            const options = {}

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.list(options)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('snaps', options))

        })

    })

    describe('Snapd->info', () => {

        it('should call request with corrects args for a given name', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.info('snapName')
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('snaps/snapName'))

        })

        it('should call request with corrects args with no snap name', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.info()
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('snaps'))

        })

    })

    // Test interfaces management

    describe('Snapd->interfaces', () => {

        it('should call request with the right args', done => {
            const snap = new Snapd()

            const body = {hello: 'world'}

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.interfaces(body)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('interfaces', body))

        })

    })

    describe('Snapd->connect', () => {

        it('should call requesr with array plugs and slots args', done => {
            const snap = new Snapd()

            const slots = ['hello', 'slots']
            const plugs = ['hello', 'plugs']

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.connect(slots, plugs)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('interfaces', {
                action: 'connect',
                slots,
                plugs
            }, { method: 'POST' }))

        })

        it('should format simple plug and slot to array', done => {
            const snap = new Snapd()

            const slots = 'slots'
            const plugs = 'plugs'

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.connect(slots, plugs)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('interfaces', {
                action: 'connect',
                slots: [slots],
                plugs: [plugs]
            }, { method: 'POST' }))

        })

    })

    describe('Snapd->disconnect', () => {

        it('should call interfaces with array plugs and slots args', done => {
            const snap = new Snapd()

            const slots = ['hello', 'slots']
            const plugs = ['hello', 'plugs']

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.disconnect(slots, plugs)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('interfaces', {
                action: 'disconnect',
                slots,
                plugs
            }, { method: 'POST' }))

        })

        it('should format simple plug and slot to array', done => {
            const snap = new Snapd()

            const slots = 'slots'
            const plugs = 'plugs'

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.disconnect(slots, plugs)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith('interfaces', {
                action: 'disconnect',
                slots: [slots],
                plugs: [plugs]
            }, { method: 'POST' }))

        })

    })

})
