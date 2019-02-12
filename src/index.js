// Copyright (c) 2019 Clément Dandrieux
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const http = require('http')

const defaultSettings = {
    socketPath: '/run/snapd.socket',
    encoding: 'utf8',
    version: '2'
}

const defaultOptions = {
    method: 'GET'
}

class Snapd {
    constructor(settings=defaultSettings){

        this.socketPath = settings.socketPath
        this.encoding = settings.encoding
        this.version = settings.version

    }

    request(path, body, options=defaultOptions){
        return new Promise((resolve, reject) => {
            const req = http.request({
                socketPath: this.socketPath,
                ...options,
                path: `/v${this.version}/${path}`
            }, response => {
                response.setEncoding(this.encoding)
                let raw = ''
                response.on('data', d => raw+=d)
                response.on('error', err => reject(err))
                response.once('end', () => {
                    response.removeAllListeners()
                    try {
                        return resolve(
                            JSON.parse(raw)
                        )
                    } catch (err) {
                        return reject(err)
                    }
                })
            })

            if(body){
                req.write(
                    JSON.stringify(body)
                )
            }

            req.end()
        })
    }

    // Shorthand methods

    // Change method is to be used for async requests

    changes(id, body, options){
        return this.request(`changes${typeof id !== 'undefined' ? '/'+id : ''}`, body, options)
    }

    systemInfo(){
        return this.request('system-info')
    }

    find(options){
        return this.request('find', options)
    }

    list(options){
        return this.request('snaps', options)
    }

    // Snap management

    info(snap){
        return this.request(`snaps${snap ? '/'+snap : ''}`)
    }

    // Interfaces management

    interfaces(options){
        return this.request('interfaces', options)
    }

    connect(slots, plugs){
        return this.interfaces({
            action: 'connect',
            slots: Array.isArray(slots) ? slots : [slots],
            plugs: Array.isArray(plugs) ? plugs : [plugs]
        }, {
            method: 'POST'
        })
    }

    disconnect(slots, plugs){
        return this.interfaces({
            action: 'disconnect',
            slots: Array.isArray(slots) ? slots : [slots],
            plugs: Array.isArray(plugs) ? plugs : [plugs]
        }, {
            method: 'POST'
        })
    }

    
}



module.exports = Snapd