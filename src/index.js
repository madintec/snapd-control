// Copyright (c) 2019 Clément Dandrieux
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const http = require('http')
const fetch = require('node-fetch')
const urljoin = require('url-join')
const FormData = require('form-data')

const defaultSettings = {
    socketPath: '/run/snapd.socket',
    version: '2',
    allowInteraction: false,
    fetchFunction: fetch
}

class Snapd {
    constructor(settings){
        this.settings = {
            ...defaultSettings,
            ...settings
        }

        this._agent = new http.Agent({
            socketPath: this.settings.socketPath
        })
    }

    static baseUrl = `http://0.0.0.0`

    _request(opts){
        const url = new URL(
            urljoin(
                `v${this.settings.version}`,
                opts.uri
            ),
            Snapd.baseUrl
        )

        const fetchOptions = {
            agent: this._agent,
            headers: {
                'Host': '',
                'X-Allow-Interaction': this.settings.allowInteraction
            }
        }

        if(opts.qs){
            url.search = new URLSearchParams(opts.qs)
        }

        if(opts.body){
            fetchOptions.body = opts.body
        }

        if(opts.form){
            Object.assign(
                fetchOptions.headers,
                opts.form.getHeaders()
            )
            fetchOptions.body = opts.form
        }

        return this.settings.fetchFunction(url, fetchOptions)
            .then(res => res.json())
            .then(this._handleResponse)
    }

    // Simply throw on snap response error
    _handleResponse(body){
        if(body.type === 'error'){
            throw new Error(body.result.message)
        } else {
            return body
        }
    }

    // Shorthand methods

    // Change method is to be used for async requests
    changes(id){
        return this._request({
            uri: `changes${typeof id !== 'undefined' ? '/'+id : ''}`
        })
    }

    systemInfo(){
        return this._request({
            uri: 'system-info'
        })
    }

    find(opts){
        return this._request({
            uri: 'find',
            qs: opts
        })
    }

    list(options={}){
        const qs = {}

        if(options.select){
            qs.select = options.select
        }
        
        if(options.snaps){
            qs.snaps = Array.isArray(options.snaps)
                ? options.snaps.join(',')
                : options.snaps
        }
        return this._request({
            uri: 'snaps',
            qs
        })
    }

    // Snap management

    info(snap){
        return this._request({
            uri: `snaps/${snap}`
        })
    }

    // Interfaces management

    // Retrieve interfaces list
    interfaces(){
        return this._request({
            uri: 'interfaces'
        })
    }

    // Connect plugs & slots
    connect(slots, plugs){
        return this._request({
            uri: 'interfaces',
            method: 'POST',
            body: {
                action: 'connect',
                slots: Array.isArray(slots) ? slots : [slots],
                plugs: Array.isArray(plugs) ? plugs : [plugs]
            }
        })
    }

    // Disconnect plugs & slots
    disconnect(slots, plugs){
        return this._request({
            uri: 'interfaces',
            method: 'POST',
            body: {
                action: 'disconnect',
                slots: Array.isArray(slots) ? slots : [slots],
                plugs: Array.isArray(plugs) ? plugs : [plugs]
            }
        })
    }

    // Daemons control

    // List available services
    services(){
        return this._request({
            uri: 'apps',
            qs: {
                'select': 'service'
            }
        })
    }

    // Start a service
    start(service){
        return this._request({
            uri: 'apps',
            method: 'POST',
            body: {
                action: 'start',
                names: Array.isArray(service) ? service : [service]
            }
        })
    }

    // Stop a service
    stop(service){
        return this._request({
            uri: 'apps',
            method: 'POST',
            body: {
                action: 'stop',
                names: Array.isArray(service) ? service : [service]
            }
        })
    }

    // Restart a service
    restart(service){
        return this._request({
            uri: 'apps',
            method: 'POST',
            body: {
                action: 'restart',
                names: Array.isArray(service) ? service : [service]
            }
        })
    }

    // Get service logs
    logs(options){
        if(typeof options === 'string') {
            return this._request({
                uri: 'logs',
                qs: {
                    names: options
                }
            })
        } else {
            return this._request({
                uri: 'logs',
                qs: {
                    names: options.names,
                    n: options.n,
                }
            })
        }
    }

    install(snap, options={}){

        // Use traditionnal snap store if snap argument is a string
        if(typeof snap === 'string'){

            return this._request({
                uri: `snaps/${snap}`,
                method: 'POST',
                body: {
                    action: 'install',
                    channel: options.channel
                }
            })

        // Try to sideload snap in form data otherwise
        } else {

            const form = new FormData()
            form.append('action', 'install')

            if(options.devmode){
                form.append('devmode', 'true')
            }

            if(options.dangerous){
                form.append('dangerous', 'true')
            }

            if(options.classic){
                form.append('classic', 'true')
            }

            if(options.jailmode){
                form.append('jailmode', 'true')
            }

            if(options.snapPath){
                form.append('snap-path', options.snapPath)
            }

            form.append('snap', snap, {
                filename: options.filename,
                contentType: options.contentType,
                knownLength: options.knownLength
            })

            return this._request({
                uri: 'snaps',
                method: 'POST',
                form
            })

        }
    }

    refresh(name, options={}){
        return this._request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'refresh',
                channel: options.channel
            }
        })
    }

    remove(name, options={}){
        return this._request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'remove',
                purge: options.purge,
                revision: options.revision
            }
        })
    }

    revert(name, options={}){
        return this._request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'revert',
                revision: options.revision,
                channel: options.channel
            }
        })
    }

    enable(name){
        return this._request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'enable'
            }
        })
    }

    disable(name){
        return this._request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'disable'
            }
        })
    }

    // Snap configuration methods

    get(name, keys){
        return this._request({
            uri: `snaps/${name}/conf`,
            method: 'GET',
            qs: {
                keys: Array.isArray(keys) ? keys.join(',') : keys
            }
        })
    }

    set(name, configuration){
        return this._request({
            uri: `snaps/${name}/conf`,
            method: 'PUT',
            body: configuration
        })
    }

    
}



module.exports = Snapd