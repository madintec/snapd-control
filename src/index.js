// Copyright (c) 2019 Clément Dandrieux
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const http = require('http')
const rp = require('request-promise-any')

const defaultSettings = {
    socketPath: '/run/snapd.socket',
    version: '2'
}

class Snapd {
    constructor(settings=defaultSettings){

        // Pre-configure request function
        this.request = rp.defaults({
            baseUrl: `http://unix:${settings.socketPath}:/v${settings.version}/`,
            headers: {
                'Host': ''
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

    list(){
        return this.request({
            uri: 'snaps'
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

    
}



module.exports = Snapd