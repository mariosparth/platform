(function() {

    var agneta = window.agneta;

    agneta.partial = function(name) {
        return agneta.langPath('partial', name);
    };

    agneta.get_icon = function(name) {
        return agneta.get_media(agneta.urljoin('icons', name));
    };

    agneta.get_asset = function(path) {
        return agneta.url(path);
    };

    agneta.get_media = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(agneta.server.media);
        return urljoin(args);
    };

    agneta.prv_media = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(agneta.url_services);
        args.unshift('media');
        return urljoin(args);
    };

    agneta.get_avatar = function(name) {
        return agneta.get_media(agneta.urljoin('avatars', name));
    };

    agneta.get_lib = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(agneta.server.lib);
        return urljoin(args);
    };

    agneta.url = function() {
        var args = Array.prototype.slice.call(arguments);
        return url_for(urljoin(args));
    };

    agneta.langPath = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(agneta.lang);
        return agneta.url.apply(this, args);
    };

    agneta.lng = function(data) {
        if (!data) {
            return;
        }

        var result = data[agneta.lang];
        if (result && result.length) {
            return result;
        }

        for (var key in data) {
            result = data[key];
            if (result && result.length) {
                return result;
            }
        }
    };

    agneta.urljoin = function() {
        var args = Array.prototype.slice.call(arguments);
        return urljoin(args);
    };

    window.colorLuminance = function ColorLuminance(hex, lum) {

        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#",
            c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        return rgb;
    };

    function url_for(path) {
        path = urljoin([agneta.root, path]);

        if (path[0] != '/')
            path = '/' + path;

        return path;
    }

    function urljoin(args) {

        if (angular.isObject(args[0])) {
            var options = args[0];
            args = options.path;
            if (options.query) {
                var params = [];
                for (var key in options.query) {
                    var param = options.query[key];
                    if (param) {
                        params.push(key + '=' + param);
                    }
                }
                if (params.length) {
                    args.push('?' + params.join('&'));
                }
            }
        }

        var result = args.join('/');
        var parts = result.split('://');
        var protocol;

        if (parts.length > 1) {
            protocol = parts[0];
            result = parts[1];
        }

        parts = result.split('/');
        result = [];

        for (var i in parts) {
            var part = parts[i];
            if (angular.isString(part) && part.length) {
                result.push(part);
            }
        }

        result = result.join('/');

        if (protocol) {
            result = protocol + '://' + result;
        } else if (args[0] && args[0][0] == '/') {
            result = '/' + result;
        }

        return result;

    }

})();
