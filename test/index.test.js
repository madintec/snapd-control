// Copyright (c) 2019 Clément Dandrieux
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const { expect, assert } = require('chai')
const fetch = require('node-fetch')
const sinon = require('sinon')
const FormData = require('form-data')
const Snapd = require('../src/index')

const http = require('http')

const { Readable } = require('stream')

const makeFakeFetch = value => sinon.fake.returns(Promise.resolve({
    json: () => Promise.resolve(value)
}))

afterEach(() => {
    // Restore the default sandbox here
    sinon.restore()
})

describe('Snapd', () => {

    describe('Snapd -> constructor', () => {

        it('should be a function', () => {
            expect(Snapd.prototype.constructor).to.be.a('function')
        })

        it('should create an http agent with the path to the socket', () => {
            const Agent = sinon.fake()
            sinon.replace(http, 'Agent', Agent)

            // Some custom settings
            const settings = {
                socketPath: '/path/to/socket',
                version: 3,
                allowInteraction: false
            }
            
            new Snapd(settings)

            expect(Agent.calledOnceWithExactly({
                socketPath: settings.socketPath
            }))
        })

    })

    describe('Snapd -> _request',  () => {

        it('should be a function', () => {
            const snap = new Snapd()
            expect(snap._request).to.be.a('function')
        })

        it('should call fetch with the correct URL', done => {

            const fakeFetch = makeFakeFetch({})
            // Some custom settings
            const settings = {
                version: 3,
                fetchFunction: fakeFetch
            }

            const expectedUrl = new URL('http://0.0.0.0/v3/snap/whatever')
            const snap = new Snapd(settings)
            
            snap._request({
                uri: 'snap/whatever'
            })
            .then(() => {
                const callArgs = fakeFetch.getCall(0).args
                expect(callArgs).to.be.an('array').lengthOf(2)
                expect(callArgs[0]).to.eql(expectedUrl)
                done()
            })
            .catch(done)
        })

        it('should call fetch with custom headers', (done) => {
            const fakeFetch = makeFakeFetch({})
            // Some custom settings
            const settings = {
                version: 3,
                fetchFunction: fakeFetch
            }

            const snap = new Snapd(settings)

            snap._request({
                uri: 'snap/whatever'
            })
            .then(() => {
                const callArgs = fakeFetch.getCall(0).args
                expect(callArgs).to.be.an('array').lengthOf(2)
                expect(callArgs[1].headers)
                    .to.eql({
                        'Host': '',
                        'X-Allow-Interaction': false
                    })
                done()
            }).catch(done)
        })

        it('should call fetch with the computed querystring', (done) => {
            const fakeFetch = makeFakeFetch({})
            // Some custom settings
            const settings = {
                version: 3,
                fetchFunction: fakeFetch
            }

            const snap = new Snapd(settings)

            const qs = {
                test: "value"
            }

            const expectedQuery = '?test=value'

            snap._request({
                uri: 'snap/whatever',
                qs
            })
            .then(() => {
                const callArgs = fakeFetch.getCall(0).args
                expect(callArgs).to.be.an('array').lengthOf(2)
                expect(callArgs[0].search.toString())
                    .to.eql(expectedQuery)
                done()
            }).catch(done)
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

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.systemInfo()
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'system-info'
            }))

        })

    })

    describe('Snapd->changes', () => {

        it('should call request with corrects args for a given id and options', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.changes(0)
                .then(done)
                .catch(done)
            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'changes/0'
            }))

        })

        it('should call request with corrects args with no args provided', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.changes()
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({uri: 'changes'}))

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

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.find(options)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'find',
                qs: options
            }))

        })

    })

    describe('Snapd->list', () => {

        it('should call request with no options', done => {
            const snap = new Snapd()

            const options = {}

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.list(options)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps',
                qs: {}
            }))

        })

        it('should take snaps string option with one snap name', done => {
            const snap = new Snapd()

            const options = {
                snaps: 'snap-name'
            }

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.list(options)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps',
                qs: {
                    snaps: options.snaps
                }
            }))

        })

        it('should take snaps array option', done => {
            const snap = new Snapd()

            const options = {
                snaps: ['snap-name', 'other-snap-name']
            }

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.list(options)
            .then(done)
            .catch(done)
            
            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps',
                qs: {
                    snaps: 'snap-name,other-snap-name'
                }
            }))

        })

        it('should take select option', done => {
            const snap = new Snapd()

            const options = {
                select: 'all'
            }

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.list(options)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps',
                qs: {
                    select: options.select
                }
            }))

        })

    })

    describe('Snapd->info', () => {

        it('should call request with corrects args for a given name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.info('snapName')
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/snapName'
            }))

        })

    })

    // Test interfaces management

    describe('Snapd->interfaces', () => {

        it('should call request with the right args', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.interfaces()
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'interfaces'
            }))

        })

    })

    describe('Snapd->connect', () => {

        it('should call request with array plugs and slots args', done => {
            const snap = new Snapd()

            const slots = ['hello', 'slots']
            const plugs = ['hello', 'plugs']

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.connect(slots, plugs)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
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

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.connect(slots, plugs)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
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

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.disconnect(slots, plugs)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
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

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.disconnect(slots, plugs)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
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


    describe('Snapd->services', () => {

        it('should call request with correct args', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.services()
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'apps',
                qs: {
                    select: 'service'
                }
            }))

        })

    })

    describe('Snapd->start', () => {

        it('should call request with simple service name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const serviceName = 'some-snap.some-daemon'

            snap.start(serviceName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'apps',
                method: 'POST',
                body: {
                    action: 'start',
                    names: [serviceName]
                }
            }))

        })

        it('should call request with an array of service names', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const serviceNames = [
                'some-snap.some-daemon',
                'some-other-snap.some-daemon'
            ]

            snap.start(serviceNames)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'apps',
                method: 'POST',
                body: {
                    action: 'start',
                    names: serviceNames
                }
            }))

        })

    })

    describe('Snapd->stop', () => {

        it('should call request with simple service name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const serviceName = 'some-snap.some-daemon'

            snap.stop(serviceName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'apps',
                method: 'POST',
                body: {
                    action: 'stop',
                    names: [serviceName]
                }
            }))

        })

        it('should call request with an array of service names', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const serviceNames = [
                'some-snap.some-daemon',
                'some-other-snap.some-daemon'
            ]

            snap.stop(serviceNames)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'apps',
                method: 'POST',
                body: {
                    action: 'stop',
                    names: serviceNames
                }
            }))

        })

    })

    describe('Snapd->restart', () => {

        it('should call request with simple service name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const serviceName = 'some-snap.some-daemon'

            snap.restart(serviceName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'apps',
                method: 'POST',
                body: {
                    action: 'restart',
                    names: [serviceName]
                }
            }))

        })

        it('should call request with an array of service names', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const serviceNames = [
                'some-snap.some-daemon',
                'some-other-snap.some-daemon'
            ]

            snap.restart(serviceNames)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'apps',
                method: 'POST',
                body: {
                    action: 'restart',
                    names: serviceNames
                }
            }))

        })

    })


    describe('Snapd->logs', () => {

        it('should call request with simple service name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const serviceName = 'some-snap.some-daemon'

            snap.logs(serviceName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'logs',
                qs: {
                    names: serviceName
                }
            }))

        })

        it('should call request with options', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const options = {
                names: 'some-snap.some-daemon',
                n: 100,
                nonexistantOption: true
            }

            snap.logs(options)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'logs',
                qs: {
                    names: options.names,
                    n: options.n
                }
            }))

        })

    })

    describe('Snapd->install', () => {

        it('should call request with the given snap name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            snap.install(snapName)
                .then(done)
                .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'install',
                    channel: undefined
                }
            }))

        })

        it('should call request with the given channel', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'
            const channel = 'candidate'

            snap.install(snapName, {
                channel
            })
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'install',
                    channel
                }
            }))

        })

        it('should call request with sideloaded snap', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapFile = Buffer.from('123')

            const options = {
                filename: 'unused-filename.snap',
                contentType: 'test/test'
            }
            const expected = new FormData()
            expected.append('action', 'install')
            
            // expected.append('devmode', 'true')
            // expected.append('dangerous', 'true')
            // expected.append('classic', 'true')
            // expected.append('jailmode', 'true')
            // expected.append('snap-path', options.snapPath)

            expected.append('snap', snapFile, {
                filename: options.filename,
                contentType: options.contentType
            })

            snap.install(snapFile, options)
                .then(() => {
                    const cfg = snap._request.getCall(0).args[0]
                    expect(cfg.uri).to.equal('snaps')
                    expect(cfg.method).to.equal('POST')

                    const data = cfg.form
                    expect(data.toString()).to.equal(expected.toString())

                    done()
                })
                .catch(done)
        })

    })

    describe('Snapd->refresh', () => {

        it('should call request with the given snap name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            snap.refresh(snapName)
                .then(done)
                .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'refresh',
                    channel: undefined
                }
            }))

        })

        it('should call request with the given channel', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'
            const channel = 'candidate'

            snap.refresh(snapName, {
                channel
            })
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'refresh',
                    channel
                }
            }))

        })
    })

    describe('Snapd->remove', () => {

        it('should call request with the given snap name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            snap.remove(snapName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'remove',
                    purge: undefined,
                    revision: undefined
                }
            }))

        })

        it('should use the given options', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            const options = {
                purge: true,
                revision: 'x12'
            }

            snap.remove(snapName, options)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'remove',
                    purge: options.purge,
                    revision: options.revision
                }
            }))

        })
    })

    describe('Snapd->revert', () => {

        it('should call request with the given snap name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            snap.revert(snapName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'revert',
                    revision: undefined,
                    channel: undefined
                }
            }))

        })

        it('should use the given options', done => {

            const snapName = 'some-snap-name'

            const options = {
                revision: 'x2',
                channel: 'stable'
            }

            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            snap.revert(snapName, options)
                .then(done)
                .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap-name',
                method: 'POST',
                body: {
                    action: 'revert',
                    revision: 'x2',
                    channel: 'stable'
                }
            }))

        })
    })

    describe('Snapd->enable', () => {

        it('should call request with the given snap name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            snap.enable(snapName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'enable'
                }
            }))

        })
    })

    describe('Snapd->disable', () => {

        it('should call request with the given snap name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            snap.disable(snapName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap',
                method: 'POST',
                body: {
                    action: 'disable'
                }
            }))

        })
    })


    // Test snap configuration methods

    describe('Snapd->get', () => {
        it('should call request with the given snap name', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            snap.get(snapName)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap/conf',
                method: 'GET',
                qs: {
                    keys: undefined
                }
            }))

        })

        it('should call request with a key string options', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'
            const keys = 'some-key'

            snap.get(snapName, keys)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap/conf',
                method: 'GET',
                qs: {
                    keys
                }
            }))

        })

        it('should call request with an array keys options', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'
            const keys = ['some-key', 'some.nested-key']

            snap.get(snapName, keys)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap/conf',
                method: 'GET',
                qs: {
                    keys: 'some-key,some.nested-key'
                }
            }))

        })
    })

    describe('Snapd->set', () => {
        it('should take a snap name and it config', done => {
            const snap = new Snapd()

            sinon.replace(snap, '_request', sinon.fake.returns(Promise.resolve()))

            const snapName = 'some-snap'

            const config = {
                'conf-key1': 'conf-value1',
                'conf-key2': 'conf-value2'
            }     

            snap.set(snapName, config)
            .then(done)
            .catch(done)

            expect(snap._request.getCall(0).args[0]).to.eql(({
                uri: 'snaps/some-snap/conf',
                method: 'PUT',
                body: config           
            }))

        })

    })
    
})
