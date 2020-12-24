// Copyright (c) 2019 Clément Dandrieux
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const http = require('http')
const fetch = require('node-fetch')
const urljoin = require('url-join')

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

        if(opts.qs){
            url.search = new URLSearchParams(opts.qs)
        }

        return this.settings.fetchFunction(url, {
            agent: this._agent,
            headers: {
                'Host': '',
                'X-Allow-Interaction': this.settings.allowInteraction
            },
        })
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

            return this._request({
                uri: 'snaps',
                method: 'POST',
                formData: {
                    action: 'install',
                    snap: {
                        value: snap,
                        options: {
                            filename: options.filename,
                        }
                    },
                    'snap-path': options.snapPath,

                    // FormData doesn't like booleans
                    devmode: options.devmode ? 'true' : undefined,
                    dangerous: options.dangerous ? 'true' : undefined,
                    classic: options.classic ? 'true' : undefined,
                    jailmode: options.jailmode ? 'true' : undefined,
                }
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