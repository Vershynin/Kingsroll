(function () {
    var app = {}
    window.cartjs = app
    var $ = null
    var timeout = 3000
    var bind = function (fn, _this) {
        return function () {
            return fn.apply(_this, arguments)
        }
    }
    var bindAll = function () {
        var obj = arguments[arguments.length - 1]
        for (var i = 0; i < (arguments.length - 1); i++) {
            var fname = arguments[i]
            var fn = obj[fname]
            if (!fn)throw new Error('no function ' + fname + ' for object ' + obj + ' !')
            obj[fname] = bind(fn, obj)
        }
    }
    var p = bind(console.log, console)
    var find = function (array, fn) {
        for (var i = 0; i < array.length; i++)if (fn(array[i]))return i
        return -1
    }
    var each = function (array, fn) {
        for (var i = 0; i < array.length; i++)fn(array[i], i)
    }
    var eachInObject = function (obj, fn) {
        for (k in obj)if (obj.hasOwnProperty(k))fn(k)
    }
    var isObjectEmpty = function (obj) {
        for (k in obj)if (obj.hasOwnProperty(k))return false
        return true
    }
    var extend = function () {
        var a = arguments[0]
        for (var i = 1; i < arguments.length; i++) {
            var b = arguments[i]
            eachInObject(b, function (k) {
                a[k] = b[k]
            })
        }
        return a
    }
    var debug = function () {
        var args = Array.prototype.slice.call(arguments)
        args.unshift('cartjs')
        console.info.apply(console, args)
    }
    var server = {}
    server.send = function (method, url, data, callback) {
        if (!window.FormData || !window.XMLHttpRequest)return callback(new Error("Your browser doesn't support that feature, please update it."))
        var formData = new FormData()
        formData.append('data', JSON.stringify(data))
        var responded = false
        var xhr = new XMLHttpRequest()
        xhr.open(method.toUpperCase(), url, true)
        xhr.onreadystatechange = function () {
            if (responded)return
            if (xhr.readyState == 4) {
                responded = true
                if (xhr.status == 200)callback(null, JSON.parse(xhr.responseText))
                else callback(new Error(xhr.responseText))
            }
        }
        setTimeout(function () {
            if (responded)return
            responded = true
            callback(new Error("no response from " + url + "!"))
        }, timeout)
        debug(method, url, data)
        xhr.send(formData)
    }
    server.post = function (url, data, callback) {
        this.send('post', url, data, callback)
    }
    var fork = function (onError, onSuccess) {
        return function () {
            var args = Array.prototype.slice.call(arguments, 1)
            if (arguments[0])onError(arguments[0])
            else onSuccess.apply(null, args)
        }
    }
    var once = function (fn) {
        var called = false
        return function () {
            if (!called) {
                called = true
                return fn.apply(this, arguments)
            }
        }
    }
    var loadCss = function (url, cssFileId, callback) {
        if (document.createStyleSheet)document.createStyleSheet(url)
        else $('<link rel="stylesheet" type="text/css" href="' + url + '" />').appendTo('head')
        var loaded = false
        var $testEl = $('<div id="' + cssFileId + '" style="display: none"></div>').appendTo('body')
        var interval = 10
        var time = 0
        var checkIfStyleHasBeenLoaded = function () {
            if ($testEl.css('position') === 'absolute') {
                loaded = true
                $testEl.remove()
                return callback()
            }
            if (time >= timeout)return callback(new Error("can't load " + url + "!"))
            time = time + interval
            setTimeout(checkIfStyleHasBeenLoaded, interval)
        }
        setTimeout(checkIfStyleHasBeenLoaded, 0)
    }
    var loadJs = function (url, callback) {
        var script = document.createElement('script')
        script.type = 'text/javascript'
        script.async = true
        var responded = false
        script.onreadystatechange = script.onload = function () {
            var state = script.readyState
            if (responded)return
            if (!state || /loaded|complete/.test(state)) {
                responded = true
                callback()
            }
        }
        script.src = url
        document.body.appendChild(script)
        setTimeout(function () {
            if (responded)return
            responded = true
            callback(new Error("can't load " + url + "!"))
        }, timeout)
    }
    var requireJQuery = function (jQueryUrl, callback) {
        if (window.jQuery)callback(null, window.jQuery)
        else loadJs(jQueryUrl, fork(callback, function () {
            if (!window.jQuery)return callback(new Error("can't load jQuery!"))
            callback(null, window.jQuery)
        }))
    }
    app.templates = {}
    app.template = function (name, fn) {
        this.templates[name] = function () {
            var buff = []
            var args = Array.prototype.slice.call(arguments)
            args.unshift(function (str) {
                buff.push(str)
            })
            fn.apply(null, args)
            return buff.join("\n")
        }
    }
    app.render = function () {
        var args = Array.prototype.slice.call(arguments, 1)
        return this.templates[arguments[0]].apply(null, args)
    }
    var escapeHtml = function (str) {
        return $('<div/>').text(str).html()
    }
    var db = {
        get: function (key) {
            return window.localStorage.getItem(key)
        }, set: function (key, value) {
            window.localStorage.setItem(key, value)
        }, remove: function (key) {
            window.localStorage.removeItem(key)
        }
    }
    app.translation = {}
    var t = function (key, options) {
        options = options || {}
        if ('count' in options)key = key + app.translation.pluralize(options.count)
        str = app.translation[key] || ('no translation for ' + key)
        eachInObject(options, function (k) {
            str = str.replace(new RegExp('\#\{' + k + '\}', 'g'), options[k])
        })
        return str
    }
    var Events = function (obj) {
        obj.on = function () {
            var fn = arguments[arguments.length - 1]
            for (var i = 0; i < (arguments.length - 1); i++) {
                var name = arguments[i]
                this.subscribers = this.subscribers || {};
                (this.subscribers[name] = this.subscribers[name] || []).push(fn)
            }
        }
        obj.trigger = function () {
            var event = arguments[0]
            var args = Array.prototype.slice.call(arguments, 1)
            debug(event, args)
            if (!this.subscribers)return
            var list = this.subscribers[event] || []
            for (var i = 0; i < list.length; i++)list[i].apply(null, args)
        }
        obj.off = function () {
            delete this.subscribers
        }
    }
    Events(app)
    app.loadResources = function (callback) {
        var baseUrl = this.baseUrl
        var baseUrlme = 'http://kings-roll.com.ua/cart'
        var language = this.language
        requireJQuery('https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js', fork(callback, function (jQuery) {
            $ = jQuery
            callback = once(callback)
            var count = 0
            var done = function (err) {
                count = count + 1
                if (err)callback(err)
                if (count == 3)callback()
            }
            loadCss(baseUrlme + '/bootstrap-widget.css', 'bootstrap-widget-loaded', fork(callback, function () {
                loadCss(baseUrlme + '/cart.css', 'cart-loaded', done)
            }))
            loadJs(baseUrlme + '/bootstrap.js', done)
            loadJs(baseUrlme + '/' + language + '.js', done)
        }))
    }
    app.languageShortcuts = {en: 'english', ru: 'russian', ua: 'ukrainian'}
    app.initialize = function (options, callback) {
        options = options || {}
        callback = callback || function (err) {
                if (err)console.error(err.message || err)
            }
        this.baseUrl = options.baseUrl || 'http://salejs.com/v1'
        this.language = options.language || 'english'
        this.language = app.languageShortcuts[this.language] || this.language
        this.currency = options.currency || '$'
        this.requireName = ('requireName' in options) ? options.requireName : true
        this.requirePhone = ('requirePhone' in options) ? options.requirePhone : true
        this.requireEmail = ('requireEmail' in options) ? options.requireEmail : false
        this.requireAddress = ('requireAddress' in options) ? options.requireAddress : false
        // this.requireOlolo = ('requireOlolo' in options) ? options.requireOlolo : true
        this.emailOrdersTo = options.emailOrdersTo
        if (!this.emailOrdersTo)return callback(new Error("cartjs - `emailOrdersTo` not set, set it please!"))
        if (!this.initialized) {
            debug('initializing')
            this.loadResources(fork(callback, bind(function () {
                this.initializeModels()
                this.initializeViews()
                this.initialized = true
                callback()
            }, this)))
        } else {
            debug('re-initializing')
            app.off()
            $(document).off('click', '.cart-buy-button')
            $(document).off('click', '.cart-button')
            this.initializeViews()
        }
    }
    app.initializeModels = function () {
        this.cart = new app.Cart()
        this.cart.load()
        this.contacts = new app.Contacts()
    }
    app.initializeViews = function () {
        this.cartButtonView = new app.CartButtonView(this.cart)
        this.cartButtonView.render()
        this.cartPopupView = new app.CartPopupView()
        this.cartPopupView.render()
        this.cartView = new app.CartView(this.cart)
        this.cartView.render()
        this.contactsView = new app.ContactsView(this.contacts, this.cart)
        this.contactsView.render()
        app.on('toggle popup', bind(function () {
            if (this.cartPopupView.isActive())this.cartPopupView.hide()
            else this.cartPopupView.show(this.cartView)
        }, this))
        app.on('purchase', bind(function () {
            this.cartPopupView.show(this.contactsView)
        }, this))
        app.on('send order', bind(function () {
            if (app.contacts.isValid()) {
                var order = {
                    price: this.cart.totalPrice(),
                    emailOrdersTo: this.emailOrdersTo,
                    site: window.location.host,
                    currency: this.currency,
                    language: this.language
                }
                extend(order, this.contacts.toJSON())
                extend(order, this.cart.toJSON())
                this.cart.removeAll()
                var message = '<div class="cart"><div class="cart-message">' + escapeHtml(t('orderSent')) + '</div></div>'
                this.cartPopupView.show(message)
                server.post(this.baseUrl + '/orders', order, bind(function (err) {
                    if (err) {
                        var message = '<div class="cart"><div class="cart-message cart-message-error">' + escapeHtml(t('orderFailed')) + '</div></div>'
                        this.cartPopupView.show(message)
                    }
                }, this))
            }
        }, this))
        app.cart.on('add item', 'remove item', 'update item', bind(function () {
            this.cartPopupView.show(this.cartView)
        }, this))
        $(document).on('click', '.cart-buy-button', bind(function (e) {
            e.preventDefault()
            var $button = $(e.currentTarget)
            this.cart.add({
                name: $button.attr('data-name'),
                price: parseInt($button.attr('data-price')),
                quantity: parseInt($button.attr('data-quantity') || 1)
            })
        }, this))
    }
    app.priceWithCurrency = function (price) {
        prefixed = ['$', '£', '€']
        if (prefixed.indexOf(this.currency.toLowerCase()) >= 0)return app.currency + price
        else return price + ' ' + app.currency
    }
    app.Cart = function (items) {
        this.items = items || []
    }
    var proto = app.Cart.prototype
    Events(proto)
    proto.load = function () {
        var jsonString = db.get('cart-items')
        debug('loading cart', jsonString)
        if (jsonString) {
            var json = JSON.parse(jsonString)
            this.items = json.items || []
        }
    }
    proto.save = function () {
        db.set('cart-items', JSON.stringify(this))
    }
    proto.toJSON = function () {
        return {items: JSON.parse(JSON.stringify(this.items))}
    }
    proto.removeAll = function () {
        var length = this.items.length
        for (var i = 0; i < length; i++)this.remove(this.items[this.items.length - 1])
    }
    proto.totalPrice = function () {
        var sum = 0
        each(this.items, function (item) {
            sum = sum + item.price * item.quantity
        })
        return sum
    }
    proto.totalQuantity = function () {
        var sum = 0
        each(this.items, function (item) {
            sum = sum + item.quantity
        })
        return sum
    }
    proto.isEmpty = function () {
        return this.items.length == 0
    }
    proto.add = function (item) {
        var i = find(this.items, function (i) {
            return i.name == item.name
        })
        if (i >= 0) {
            var existingItem = this.items[i]
            this.update(item.name, {quantity: (existingItem.quantity + item.quantity)})
        } else {
            this.validateItem(item)
            this.items.push(item)
            this.save()
            this.trigger('add item', item)
        }
    }
    proto.remove = function (nameOrItem) {
        var name = nameOrItem.name || nameOrItem
        var i = find(this.items, function (i) {
            return i.name = name
        })
        if (i >= 0) {
            var item = this.items[i]
            this.items.splice(i, 1)
            this.save()
            this.trigger('remove item', item)
        }
    }
    proto.update = function (name, attrs) {
        var i = find(this.items, function (i) {
            return i.name == name
        })
        if (i >= 0) {
            var item = this.items[i]
            this.validateItem(extend({}, item, attrs))
            extend(item, attrs)
            this.save()
            this.trigger('update item', item)
        }
    }
    proto.validateItem = function (item) {
        if (!item.name)throw new Error('no name!')
        if (!item.price)throw new Error('no price!')
        if (!((item.quantity > 0) || (item.quantity === 0)))throw new Error('no quantity!')
    }
    app.Contacts = function () {
        extend(this, {name: '', phone: '', email: 'наличные', address: '', errors: {}})
    }
    var proto = app.Contacts.prototype
    Events(proto)
    proto.set = function (attrs) {
        extend(this, attrs)
        this.validate()
        this.trigger('update', this)
    }
    proto.validate = function () {
        this.errors = {}
        // if (app.requireName && !this.name)this.errors.name = ["can't be empty"]
        if (app.requirePhone) {
            var errors = []
            if (!this.phone)errors.push("can't be empty")
            if (!/^[0-9\- +]+$/.test(this.phone))errors.push("invalid phone number")
            if (errors.length > 0)this.errors.phone = errors
        }
        // if (app.requireEmail && !this.email)this.errors.email = ["can't be empty"]
        // if (app.requireAddress && !this.address)this.errors.address = ["can't be empty"]
        // if (app.requireOlolo && !this.ololo)this.errors.ololo = ["can't be empty"]
        return this.errors
    }
    proto.toJSON = function () {
        var data = {}
        if (app.requireName)data.name = this.name
        if (app.requirePhone)data.phone = this.phone
        if (app.requireEmail)data.email = this.email
        if (app.requireAddress)data.address = this.address
        // if (app.requireOlolo)data.ololo = this.ololo
        return data
    }
    proto.isValid = function () {
        return isObjectEmpty(this.errors)
    }
    app.CartButtonView = function (cart) {
        this.cart = cart
        bindAll('render', this)
        this.cart.on('add item', 'remove item', 'update item', this.render)
        $(document).on('click', '.cart-button', function (e) {
            e.preventDefault()
            app.trigger('toggle popup')
        })
    }
    var proto = app.CartButtonView.prototype
    proto.render = function () {
        var $button = $('.cart-button')
        $button.find('.cart-button-quantity').text(this.cart.items.length)
        $button.find('.cart-button-label').text(t('cartButtonLabel', {count: this.cart.items.length}))
        $button.removeClass('cart-button-empty').removeClass('cart-button-not-empty').removeClass('loaded')
        $button.addClass(this.cart.isEmpty() ? 'cart-button-empty' : 'cart-button-not-empty')
        $button.show()
    }
    app.CartPopupView = function () {
        this._isActive = false
        bindAll('render', 'show', 'hide', 'isActive', this)
    }
    var proto = app.CartPopupView.prototype
    proto.render = function () {
    }
    proto.show = function (content) {
        var contentEl = content.$el || content
        if (this.isActive()) {
            if (this.content === content)return
            else {
                var $popoverContent = $('body > .bootstrap-widget .popover-content')
                $popoverContent.find('> *').detach()
                $popoverContent.append(contentEl)
                this.content = content
            }
        } else {
            this._isActive = true
            this.content = content
            if (!($('.bootstrap-widget').size() > 0))$('<div class="bootstrap-widget"></div>').appendTo('body')
            $('.cart-button').popover({
                content: contentEl,
                html: true,
                placement: 'bottom',
                container: 'body > .bootstrap-widget',
                trigger: 'manual'
            })
            $('.cart-button').popover('show')
        }
    }
    proto.hide = function () {
        $('.cart-button').popover('destroy')
        this._isActive = false
        this.content = null
    }
    proto.isActive = function () {
        return this._isActive && ($('.bootstrap-widget .popover').size() > 0)
    }
    app.CartView = function (cart) {
        this.cart = cart
        bindAll('render', 'renderPurchaseButton', 'renderAddItem', 'renderRemoveItem', 'renderUpdateItem', 'scrollQuantity', 'updateQuantity', 'removeItem', this)
        this.cart.on('add item', 'remove item', 'update item', this.renderPurchaseButton)
        this.cart.on('add item', this.renderAddItem)
        this.cart.on('remove item', this.renderRemoveItem)
        this.cart.on('update item', this.renderUpdateItem)
        this.$el = $('<div class="cart"></div>')
        this.$el.on('keyup', '.cart-item-quantity', this.scrollQuantity)
        this.$el.on('change', '.cart-item-quantity', this.updateQuantity)
        this.$el.on('click', '.cart-item-remove', this.removeItem)
        this.$el.on('click', '.cart-purchase-button', function (e) {
            e.preventDefault()
            app.trigger('purchase')
        })
    }
    var proto = app.CartView.prototype
    proto.render = function () {
        this.$el.html(app.render('cart', this.cart))
        this.renderPurchaseButton()
    }
    proto.renderPurchaseButton = function () {
        var $purchaseButton = this.$el.find('.cart-purchase-button')
        if (this.cart.totalQuantity() > 0)$purchaseButton.removeAttr('disabled')
        else $purchaseButton.attr({disabled: 'disabled'})
        $purchaseButton.html(app.render('cart-purchase-button', this.cart.totalPrice()))
    }
    proto.renderAddItem = function (item) {
        var $cartItems = this.$el.find('.cart-items')
        if ($cartItems.size() > 0)$cartItems.append(app.render('cart-item', item))
        else this.render()
    }
    proto.renderRemoveItem = function (item) {
        if (this.cart.items.length == 0)this.render()
        this.$el.find('.cart-item[data-name="' + escapeHtml(item.name) + '"]').remove()
    }
    proto.renderUpdateItem = function (item) {
        var $input = this.$el.find('.cart-item-quantity[data-name="' + escapeHtml(item.name) + '"]')
        if (parseInt($input.val()) != item.quantity) {
            var input = $input[0]
            var selectionStart = input.selectionStart
            var selectionEnd = input.selectionEnd
            $input.val(item.quantity)
            input.setSelectionRange(selectionStart, selectionEnd)
        }
    }
    proto.scrollQuantity = function (e) {
        e.preventDefault()
        var delta = 0
        if (e.keyCode == 38)delta = 1
        if (e.keyCode == 40)delta = -1
        if (delta === 0)return
        var $input = $(e.currentTarget)
        var name = $input.attr('data-name')
        var quantity = parseInt($input.val()) + delta
        if (quantity >= 0)this.cart.update(name, {quantity: quantity})
    }
    proto.updateQuantity = function (e) {
        e.preventDefault()
        var $input = $(e.currentTarget)
        var name = $input.attr('data-name')
        var quantity = parseInt($input.val())
        if (quantity >= 0)this.cart.update(name, {quantity: quantity})
    }
    proto.removeItem = function (e) {
        e.preventDefault()
        var $removeButton = $(e.currentTarget)
        this.cart.remove($removeButton.attr('data-name'))
    }
    app.template('cart', function (add, cart) {
        add('<div class="cart">')
        if (cart.items.length > 0) {
            add('<div class="cart-items">')
            each(cart.items, function (item) {
                add(app.render('cart-item', item))
            })
            add('</div>')
            add('<button class="btn btn-primary cart-purchase-button" type="button"></button>')
        } else add('<div class="cart-message">' + escapeHtml(t('emptyCart')) + '</div>')
        add('</div>')
    })
    app.template('cart-purchase-button', function (add, totalPrice) {
        add('<span class="cart-purchase-button-label">' + escapeHtml(t('purchaseButtonTitle')) + '</span>')
        add('<span class="cart-purchase-button-price">' + app.priceWithCurrency(totalPrice) + '</span>')
    })
    app.template('cart-item', function (add, item) {
        add('<div class="cart-item" data-name="' + escapeHtml(item.name) + '">')
        add('<div class="cart-item-name">' + escapeHtml(item.name) + '</div>')
        add('<a href="#" class="cart-item-remove" data-name="' + escapeHtml(item.name) + '">&times;</a>')
        add('<input class="cart-item-quantity form-control" type="text" value="' + item.quantity + '" data-name="' + escapeHtml(item.name) + '">')
        add('<div class="cart-item-multiply-sign">&times;</div>')
        var priceWithCurrency = app.priceWithCurrency(item.price)
        if (priceWithCurrency.length > 5)priceWithCurrency = item.price
        add('<div class="cart-item-price">' + priceWithCurrency + '</div>')
        add('<div class="cart-clearfix"></div>')
        add('</div>')
    })
    app.ContactsView = function (contacts, cart) {
        this.contacts = contacts
        this.cart = cart
        bindAll('render', 'renderUpdate', 'updateInput', this)
        this.contacts.on('update', this.renderUpdate)
        this.cart.on('add item', 'remove item', 'update item', this.render)
        this.$el = $('<div class="cart"></div>')
        this.$el.on('change', 'input, textarea', this.updateInput)
        var sendOrder = bind(function (e) {
            e.preventDefault()
            this.contacts.set(this.getValues())
            this.showAllErrors = true
            this.renderUpdate()
            app.trigger('send order')
        }, this)
        this.$el.on('click', '.cart-send-order-button', sendOrder)
        this.$el.on('submit', 'form', sendOrder)
        this.showAllErrors = false
    }
    var proto = app.ContactsView.prototype
    proto.render = function () {
        this.$el.html(app.render('contact-form', this.contacts, this.cart.totalPrice(), this.showAllErrors))
    }
    proto.renderUpdate = function () {
        this.$el.find('.form-group').each(bind(function (i, e) {
            var $group = $(e)
            var $input = $group.find('input, textarea')
            var input = $input[0]
            var name = $input.attr('name')
            $group.removeClass('has-error').removeClass('has-success')
            if (this.showAllErrors || ($input.attr('data-changed') == 'changed'))$group.addClass(this.contacts.errors[name] ? 'has-error' : 'has-success')
            // if ($input.val() !== this.contacts[name]) {
            //     var selectionStart = input.selectionStart
            //     var selectionEnd = input.selectionEnd
            //     $input.val(this.contacts[name])
            //     // input.setSelectionRange(selectionStart, selectionEnd)
            // }
        }, this))
    }
    proto.updateInput = function (e) {
        e.preventDefault()
        var $input = $(e.currentTarget)
        $input.attr('data-changed', 'changed')
        var attrs = {}
        attrs[$input.attr('name')] = $input.val()
        this.contacts.set(attrs)
    }
    proto.getValues = function () {
        var attrs = {}
        this.$el.find('input, textarea').each(bind(function (i, e) {
            var $input = $(e)
            attrs[$input.attr('name')] = $input.val()
        }, this))
        return attrs
    }
    app.template('contact-form', function (add, contacts, totalPrice, showAllErrors) {
        add('<form role="form">')
        var errorClass = function (attribute) {
            if (contacts.errors[attribute])return ' has-error'
            else return showAllErrors ? ' has-success' : ''
        }
        if (app.requireName) {
            add('<div class="form-group' + errorClass('name') + '">')
            add('<label class="control-label" for="cart-name">' + escapeHtml(t('nameFieldLabel')) + '</label>')
            add('<input type="text" name="name" class="form-control" id="cart-name"' + ' placeholder="' + escapeHtml(t('nameFieldPlaceholder')) + '"' + ' required value="' + contacts.name + '">')
            add('</div>')
        }
        if (app.requirePhone) {
            add('<div class="form-group' + errorClass('phone') + '">')
            add('<label class="control-label" for="cart-phone">' + escapeHtml(t('phoneFieldLabel')) + '<b>*</b></label>')
            add('<input type="text" name="phone" class="form-control" id="cart-phone"' + ' placeholder="' + escapeHtml(t('phoneFieldPlaceholder')) + '"' + ' required value="' + contacts.phone + '">')
            add('</div>')
        }
        if (app.requireEmail) {
            add('<div class="form-group hide' + errorClass('email') + '">')
            add('<label class="control-label" for="cart-email">' + escapeHtml(t('emailFieldLabel')) + '</label>')
            add('<input type="text" name="email" class="form-control cart-mail" id="cart-email"' + ' placeholder="' + escapeHtml(t('emailFieldPlaceholder')) + '"' + ' required value="' + contacts.email + '">')
            add('</div>')
        }
        if (app.requireAddress) {
            add('<div class="form-group' + errorClass('address') + '">')
            add('<label class="control-label" for="cart-address">' + escapeHtml(t('addressFieldLabel')) + '</label>')
            add('<textarea type="text" name="address" class="form-control" id="cart-address"' + ' placeholder="' + escapeHtml(t('addressFieldPlaceholder')) + '"' + ' required rows="3">' + contacts.address + '</textarea>')
            add('</div>')
        }
        add('<div class="form-group' + errorClass('address') + '">')
        add('<div class="radio">')
        add('<label class="check-type check-nal">')
        add('<input type="radio" name="optionsRadios" id="optionsRadios1" value="option1" checked>Наличный расчет')
        add('</label>')
        add('</div>')
        add('<div class="radio">')
        add('<label class="check-type check-beznal">')
        add('<input type="radio" name="optionsRadios" id="optionsRadios2" value="option2">Безналичный расчет')
        add('<div class="pay-info">')
        add('<span>Переведите деньги на счет <b>5168-7555-1537-2940</b> в размере <b>' + app.priceWithCurrency(totalPrice) + '</b>. Оформите заказ и наш оператор свяжется с вами.</span>')
        add('</div>')
        add('</label>')
        add('</div>')
        add('</div>')
        add('<button type="button" class="btn btn-primary cart-send-order-button">')
        add('<span class="cart-send-order-button-label">' + 'Оформить заказ на ' + '</span>')
        add('<span class="cart-send-order-button-price">' + app.priceWithCurrency(totalPrice) + '</span>')
        add('</button>')
        add('</form>')
    })
})()
