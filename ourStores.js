export default class OurStores {
	constructor() {
		//auto init
		if ($('body').hasClass('body_class')) {
            this.initMap();
            this.searchCep();
            this.geoLocationButtom();
            this.endInput();
            this.modalCall();
		}
    }

    initMap() {
        if($(window).width() < 768){
            $('.itFormPickUp__form').append($('.mapPoints, .details').get())
        }

        setTimeout(function(){
            var map = new google.maps.Map($('.mapPoints')[0], {
                center: {lat: -15.795731, lng: -47.879697},
                zoom: 5
            })
        },300)
    }

    mapLocations(locations, coordenadas) {
        let _this = this;

        var map = new google.maps.Map($('.mapPoints')[0], {
            center: coordenadas,
            zoom: 12
        })

        var myMarker = new google.maps.Marker({
            position: coordenadas,
            map: map,
            icon: '/arquivos/balao-icon.png'
        })
        
        var markers = locations.map(function(location, i) {
            setTimeout(function(){
                google.maps.event.addListener(markers[i],"click", function(e) { 
                    $(`.itResultsStores__store[data-index="${i}"]`).trigger('click');
                });
            },200)
            return new google.maps.Marker({
                position: location,
                map: map,
                icon: '/arquivos/pin-pequeno.png'
            })
        })

        $('.itResultsStores__store').click(function(){
            let index = $(this).data('index');
            let lat = $(this).data('lat');
            let lng = $(this).data('lng');
            let nameStore = $(this).find('.itResultsStores__storeName').text();
            let address = $(this).find('.itResultsStores__address').text();
            let phone = $(this).find('.itResultsStores__phone').text();
            let businessHours = $(this).find('.itResultsStores__businessHours').html();

            if($('.itResultsStores__store.checked').size() > 0){
                let index = $('.itResultsStores__store.checked').data('index');
                $('.itResultsStores__store').removeClass('checked');
                setTimeout(function(){
                    markers[index].setAnimation(null);
                }, 100)
            }
            markers[index].setAnimation(google.maps.Animation.BOUNCE)
            map.setCenter({lat, lng})
            $(this).addClass('checked');

            _this.datailsLocation(nameStore, address, phone, coordenadas, lng, lat, businessHours);

            if($(window).width() < 768){
                $('.mapPoints').addClass('check');
                $('html, body').animate({
                    scrollTop: $('.mapPoints').offset().top
                }, 900);
            }
        })

        google.maps.event.addDomListener(window, 'load', map);
    }

    datailsLocation(nameStore, address, phone, coordenadas, lngDest, latDest, businessHours){
        let lngPart = coordenadas.lng;
        let latPart = coordenadas.lat;
        let urlRoute = `https://www.google.com.br/maps/dir/'${latPart},${lngPart}'/'${latDest},${lngDest}'`;
        let phoneFormat = phone.replace(/\(|\)|-/g, '');
        $('.details').hide();
        $('.details__nameStore').text(nameStore);
        $('.details__address').text(address);
        $('.details__timetable').html(businessHours);

        if(phone.trim().length > 0){
            $('.details__call a').attr('href', `tel:+550${phoneFormat}`);
            $('.details__modalCall').text(phone.replace('-', ' '));
            $('.details__call, .details__modalCall').show();
        } else{
            $('.details__call, .details__modalCall').hide();
        }
        $('.details__route a').attr('href', urlRoute);
        $('.details').fadeIn();
    }

    modalCall(){
        if($(window).width() > 768){
            $('.details__call').click(function(e){
                e.preventDefault();
            })
        }
    }

	consultPoints(coordenadas) {
        let _this = this;
		let settings = {
            "url": `/api/checkout/pub/pickup-points?geoCoordinates=${coordenadas}&page=1&pageSize=100`,
            "method": "GET",
            "timeout": 0,
            "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json"
            },
        };
      
        $.ajax(settings).done(function (response) {
            _this.listStores(response, coordenadas);
        });
    }
    
    endInput() {
        $('.itFormPickUp__cep input').keyup(function (){
            if($(this).val().length > 2) {
                $('.itFormPickUp__submit').addClass('active')
            } else{
                $('.itFormPickUp__submit').removeClass('active')
            }
        })
        
    }
    
    cepForGeocode(cep) {
        let _this = this;
        let settings = {
            "url": `https://maps.googleapis.com/maps/api/geocode/json?address=${cep}&key=AIzaSyBvQzuK7Z2ASDj05X58Z42nGem5h8LJ3nY`,
            "method": "GET"
        };
        
        $.ajax(settings).done(function (response) {
            if(response.status == 'ZERO_RESULTS'){
                alert('Endereço Inválido')
            } else {
                if(response.results.length > 1){
                   _this.modalLocations(response.results)
                } else{
                    _this.consultPoints(`${response.results[0].geometry.location.lng};${response.results[0].geometry.location.lat}`);
                }
            }
        });
    }

    modalLocations(locations) {
        let _this = this;
        $('.body_class .modalLocation').remove();
        let modal = `
            <div class="modalLocation">
                <div class="modalLocation__internal">
                <span class="modalLocation__close"> </span>
                    <h3> Mais de um endereço encontrado </h3>
                    <p> Selecione o endereço correto: </p>
                    <ul class="modalLocation__listAddress">
                        
                    </ul>
                </div>
            </div>
        `

        $('.body_class').append(modal);

        $.each(locations, function(i){
            $('.modalLocation__listAddress').prepend(
                `
                <li class="modalLocation__address" data-address="${locations[i].formatted_address}">
                    ${locations[i].formatted_address}
                </li>
                `
            )
        })

        $('.modalLocation__close').click(function(){
            $('.modalLocation').fadeOut();
        })

        $('.modalLocation__address').click(function(){
            $('.itFormPickUp__cep input').val($(this).data('address'))
            _this.cepForGeocode($(this).data('address'))
            $('.modalLocation').fadeOut();
        })
    }

    listStores(stores, coordenadas) {
        console.log(stores)
        let _this = this;
        let listStores = `
            <div class="itResultsStores">
                <h3 class="itResultsStores__title"> Foram encontradas <span class="totalStores"> </span> </h3>
                <ul class="itResultsStores__stores">
                </ul>
            </div>
        `
        $('.itResultsStores').remove();
        $('.itFormPickUp__subtitle').hide();
        $('.itFormPickUp__subtitle, .itFormPickUp__submit, .itFormPickUp__geolocation').hide();
        $('.itFormPickUp__form').after(listStores);
        let qtyStores = stores.items.length > 8 ? 8 : stores.items.length;
        if(qtyStores > 0){
            let textStores = qtyStores > 1 ? `${qtyStores} lojas próximas:` : `1 loja próxima:`;
            $('.itResultsStores__title .totalStores').html(textStores);
        } else{
            $('.itResultsStores__title').html('<b>Ainda não possuimos lojas próximas :(</b>');
        }
        let locations = []
        $.each(stores.items, function(i){
            if(i == 8){
                return false
            } else {
                let item = stores.items[i].pickupPoint;
                let storeName = item.friendlyName;
                let storeNameFormat = item.friendlyName.replace(/ /g, '-');
                let rua = item.address.street;
                let numero = item.address.number;
                let bairro = item.address.neighborhood;
                let cidade = item.address.city;
                let estado = item.address.state;
                let cep = item.address.postalCode;
                let lng = item.address.geoCoordinates[0];
                let lat = item.address.geoCoordinates[1];
                let atendimento = {
                    "domingoAbertura":  stores.items[i].pickupPoint.businessHours[0].OpeningTime.substring(0, 5).replace(':', 'h'),
                    "domingoFechamento":  stores.items[i].pickupPoint.businessHours[0].ClosingTime.substring(0, 5).replace(':', 'h'),
                    "sabadoAbertura":  stores.items[i].pickupPoint.businessHours[6].OpeningTime.substring(0, 5).replace(':', 'h'),
                    "sabadoFechamento":  stores.items[i].pickupPoint.businessHours[6].ClosingTime.substring(0, 5).replace(':', 'h'),
                    "semanaAbertura":  stores.items[i].pickupPoint.businessHours[1].OpeningTime.substring(0, 5).replace(':', 'h'),
                    "semanaFechamento":  stores.items[i].pickupPoint.businessHours[1].ClosingTime.substring(0, 5).replace(':', 'h')
                }

                locations.push({lng, lat});
                let store = `
                    <li class="itResultsStores__store" data-lng="${lng}" data-lat="${lat}" data-index="${i}">
                        <h4 class="itResultsStores__storeName"> ${storeName} </h4>
                        <p class="itResultsStores__address"> ${rua}, ${numero}, ${bairro}, ${cidade} - ${estado}, CEP: ${cep} </p>
                        <span class="itResultsStores__phone" style="display: none"> </span>
                        <span class="itResultsStores__businessHours" style="display: none">
                            2ª à 6ª - ${atendimento.semanaAbertura} às ${atendimento.semanaFechamento}<br>
                            Sábados -  ${atendimento.sabadoAbertura} às ${atendimento.sabadoFechamento}<br>
                            Domingos e Feriados - ${atendimento.domingoAbertura} às ${atendimento.domingoFechamento}
                        </span>
                    </li>
                `
                $('.itResultsStores__stores').append(store);

                var settings = {
                    "async": true,
                    "crossDomain": true,
                    "url": `/api/dataentities/TL/search?_fields=loja,telefone&_where=(loja=${storeNameFormat})&an=storeName`,
                    "method": "GET",
                    "headers": {
                        "Content-Type": "application/json",
                        "Accept": "application/vnd.vtex.ds.v10+json", 
                        "REST-Range": "resources=0-999"
                    }
                }
                
                $.ajax(settings).done(function (response) {
                    if(response.length){
                        $(`.itResultsStores__store[data-index="${i}"] .itResultsStores__phone`).prepend(response[0].telefone);
                    }
                })
            }
        })

        let lng= parseFloat(coordenadas.split(';')[0]);
        let lat= parseFloat(coordenadas.split(';')[1]);

        $('.details').fadeOut();
        $('.mapPoints').removeClass('check')
        if($(window).width() < 768){
            $('.mapPoints').fadeIn();
        }

        _this.mapLocations(locations, {lng, lat});
    }

    searchCep() {
        let _this = this;
        $('.itFormPickUp__submit').click(function(){
            let location = $('.itFormPickUp__cep input').val().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '+');
            
            if(location.length < 1){
                alert('Insira um endereço válido')
            } else{
                _this.cepForGeocode(location);
            }
        })

        $('.itFormPickUp__btnBusca').click(function(){
            $('.itFormPickUp__submit').trigger('click');
        })

        $(document).on('keyup', '.itFormPickUp__cep input', function(e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code==13) {
                $('.itFormPickUp__submit').trigger('click')
            }
        })
    }

    geoLocationButtom (){
        let _this = this;
        if( !('geolocation' in navigator) ) {
            $('itFormPickUp__geolocation').hide();
        } 

        $('.itFormPickUp__geolocation').click(function(){
            navigator.geolocation.getCurrentPosition(function(position) {
                let latitude = position.coords.latitude;
                let longitude = position.coords.longitude;
                _this.consultPoints(`${longitude};${latitude}`);
            });
        })

    }
    
}
