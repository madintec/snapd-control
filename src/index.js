// Copyright (c) 2019 Clément Dandrieux
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const rp = require('request-promise-any')

const defaultSettings = {
    socketPath: '/run/snapd.socket',
    version: '2',
    allowInteraction: false
}

class Snapd {
    constructor(settings){
        this.settings = {
            ...defaultSettings,
            ...settings
        }

        // Pre-configure request function
        this.request = rp.defaults({
            baseUrl: `http://unix:${this.settings.socketPath}:/v${this.settings.version}/`,
            headers: {
                'Host': '',
                'X-Allow-Interaction': this.settings.allowInteraction
            },
            json: true,
            simple: false,
            transform: this._handleResponse
        })
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
        return this.request({
            uri: `changes${typeof id !== 'undefined' ? '/'+id : ''}`
        })
    }

    systemInfo(){
        return this.request({
            uri: 'system-info'
        })
    }

    find({
        q,
        name,
        section,
        select,
    }){
        return this.request({
            uri: 'find',
            qs: {
                q, name, section, select
            }
        })
    }

    list(options={}){
        return this.request({
            uri: 'snaps',
            qs: {
                select: options.select,
                snaps: Array.isArray(options.snaps) ? options.snaps.join(',') : options.snaps
            }
        })
    }

    // Snap management

    info(snap){
        return this.request({
            uri: `snaps/${snap}`
        })
    }

    // Interfaces management

    // Retrieve interfaces list
    interfaces(){
        return this.request({
            uri: 'interfaces'
        })
    }

    // Connect plugs & slots
    connect(slots, plugs){
        return this.request({
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
        return this.request({
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
        return this.request({
            uri: 'apps',
            qs: {
                'select': 'service'
            }
        })
    }

    // Start a service
    start(service){
        return this.request({
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
        return this.request({
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
        return this.request({
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
            return this.request({
                uri: 'logs',
                qs: {
                    names: options
                }
            })
        } else {
            return this.request({
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

            return this.request({
                uri: `snaps/${snap}`,
                method: 'POST',
                body: {
                    action: 'install',
                    channel: options.channel
                }
            })

        // Try to sideload snap in form data otherwise
        } else {

            return this.request({
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
        return this.request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'refresh',
                channel: options.channel
            }
        })
    }

    remove(name){
        return this.request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'remove'
            }
        })
    }

    revert(name, options={}){
        return this.request({
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
        return this.request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'enable'
            }
        })
    }

    disable(name){
        return this.request({
            uri: `snaps/${name}`,
            method: 'POST',
            body: {
                action: 'disable'
            }
        })
    }

    // Snap configuration methods

    get(name, keys){
        return this.request({
            uri: `snaps/${name}/conf`,
            method: 'GET',
            qs: {
                keys: Array.isArray(keys) ? keys.join(',') : keys
            }
        })
    }

    set(name, configuration){
        return this.request({
            uri: `snaps/${name}/conf`,
            method: 'PUT',
            body: configuration
        })
    }

    
}



module.exports = Snapd