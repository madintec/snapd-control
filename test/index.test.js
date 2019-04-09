// Copyright (c) 2019 Clément Dandrieux
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const { expect, assert } = require('chai')
const rp = require('request-promise-any')
const sinon = require('sinon')
const Snapd = require('../src/index')


afterEach(() => {
    // Restore the default sandbox here
    sinon.restore()
})

describe('Snapd', () => {

    describe('Snapd -> constructor', () => {

        it('should be a function', () => {
            expect(Snapd.prototype.constructor).to.be.a('function')
        })

        it('should pre-configure request', () => {
            const fakeReq = sinon.fake()
            sinon.replace(rp, 'defaults', fakeReq)

            // Some custom settings
            const settings = {
                socketPath: '/path/to/socket',
                version: 3
            }

            // Corresponding baseUrl
            const baseUrl = 'http://unix:/path/to/socket:/v3/'

            const snap = new Snapd(settings)

            expect(fakeReq.callCount).to.equal(1)
            expect(fakeReq.lastCall.args.length).to.equal(1)
            expect(fakeReq.lastCall.args[0]).to.eql({
                baseUrl,
                headers: {
                    'Host': ''
                },
                json: true,
                simple: false,
                transform: snap._handleResponse
            })
        })
    })

    describe('Snapd -> _handleResponse', () => {

        it('should be a function', () => {
            const snap = new Snapd()
            expect(snap._handleResponse).to.be.a('function')
        })

        it('should throw when response type is error', () => {
            const snap = new Snapd()

            const errorMessage = 'Some random error message'

            expect(() => snap._handleResponse({
                type: 'error',
                result: {
                    message: errorMessage
                }
            })).to.throw(errorMessage)
        })

        it('should return the whole response body', () => {
            const snap = new Snapd()

            const body = {
                type: 'sync',
                result: {
                    data: 'some data'
                }
            }

            expect(snap._handleResponse(body))
                .to.equal(body)
        })
    })


    describe('Snapd->systemInfo', () => {

        it('should call request with corrects args', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.systemInfo()
            .then(done)
            .catch(done)

            assert(snap.request.calledWith({
                uri: 'system-info'
            }))

        })

    })

    describe('Snapd->changes', () => {

        it('should call request with corrects args for a given id and options', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.changes(0)
                .then(done)
                .catch(done)
            assert(snap.request.calledWith({
                uri: 'changes/0'
            }))

        })

        it('should call request with corrects args with no args provided', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.changes()
            .then(done)
            .catch(done)

            assert(snap.request.calledWith({uri: 'changes'}))

        })

    })

    describe('Snapd->find', () => {

        it('should call request with corrects args', done => {
            const snap = new Snapd()

            const options = {
                q: 'test',
                name: 'test',
                select: 'test',
                section: 'test'
            }

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.find(options)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith({
                uri: 'find',
                qs: options
            }))

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

            assert(snap.request.calledWith({
                uri: 'snaps',
                ...options
            }))

        })

    })

    describe('Snapd->info', () => {

        it('should call request with corrects args for a given name', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.info('snapName')
            .then(done)
            .catch(done)

            assert(snap.request.calledWith({
                uri: 'snaps/snapName'
            }))

        })

    })

    // Test interfaces management

    describe('Snapd->interfaces', () => {

        it('should call request with the right args', done => {
            const snap = new Snapd()

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.interfaces()
            .then(done)
            .catch(done)

            assert(snap.request.calledWith({
                uri: 'interfaces'
            }))

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

            assert(snap.request.calledWith({
                uri: 'interfaces',
                method: 'POST',
                body: {
                    action: 'connect',
                    slots,
                    plugs
                }
            }))

        })

        it('should format simple plug and slot to array', done => {
            const snap = new Snapd()

            const slots = 'slots'
            const plugs = 'plugs'

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.connect(slots, plugs)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith({
                uri: 'interfaces',
                method: 'POST',
                body: {
                    action: 'connect',
                    slots: [slots],
                    plugs: [plugs]
                }
            }))

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

            assert(snap.request.calledWith({
                uri: 'interfaces',
                method: 'POST',
                body: {
                    action: 'disconnect',
                    slots,
                    plugs
                }
            }))

        })

        it('should format simple plug and slot to array', done => {
            const snap = new Snapd()

            const slots = 'slots'
            const plugs = 'plugs'

            sinon.replace(snap, 'request', sinon.fake.returns(Promise.resolve()))

            snap.disconnect(slots, plugs)
            .then(done)
            .catch(done)

            assert(snap.request.calledWith({
                uri: 'interfaces',
                method: 'POST',
                body: {
                    action: 'disconnect',
                    slots: [slots],
                    plugs: [plugs]
                }
            }))

        })

    })

})
