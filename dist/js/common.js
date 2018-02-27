// $('.cart-button').addClass('loaded');
$(document).ready(function() {

    var mql = window.matchMedia('(max-width: 767px)');
    var sql = window.matchMedia('(max-width: 480px)');
    $(window).scroll(function() {
        if ($(this).scrollTop() > 110) {
            $("#cart-btn").addClass('is-sticky');
            $("body").addClass('cart-fixed');
            $('#scroll-top').addClass('scroll-top_on');
            if (mql.matches) {
                // $('.cart-button').popover('destroy');
                $('.callback').addClass('callback_on');
            }
        } else {
            $("#cart-btn").removeClass('is-sticky');
            $("body").removeClass('cart-fixed');
            $('#scroll-top').removeClass('scroll-top_on');
            $('.cart-button').popover('destroy');
            if (mql.matches) {
                $('.callback').removeClass('callback_on');
            }
        }
    });

    $('#scroll-top').click(function() {
        $('body,html').animate({
            scrollTop: 0
        }, 400);
        return false;
    });
    $("#callback-form").submit(function(e) {
        e.preventDefault();
        var form_data = $(this).serialize();
        $.ajax({
            type: "POST",
            url: "php/mail.php",
            data: form_data,
            beforeSend: function() {
                console.log('jnghfdrf');
            },
            success: function(res) {
                alert("Ваше сообщение отправлено!");
                console.log('res', res);
            },
            error: function(error) {
                console.log(error);
                alert("Произошла ошибка, попробуйте еще раз!");
            }
        });
    });
    // $("#cart-btn").sticky({topSpacing:0});
});


cartjs.initialize({
    emailOrdersTo: 'kings.roll.sushi@gmail.com',
    emailOrdersFrom: 'kings.roll.sushi@gmail.com',
    emailClientTo: false,
    language: 'russian',
    basketAnimation: true,
    currency: 'Грн',
    requireName: true,
    requirePhone: true,
    requireEmail: true,
    phoneMask: '+38 (999) 999 99 99',
    requireAddress: true,
    redirect: '',
    hideOnClick: true,
    positionPopover: 'center',
    minSum: 0,
    minSumOn: true,
    aboutShop: "Тел. +38 (066) 320 01 81, email: kings.roll.com.ua@gmail.com, Адрес: г.Запорожье "
})


// $(document).on('click', '.check-nal', function() {
//     setTimeout(function () {
//         $('.cart-mail').val('наличные')
//     }, 10);
//     console.log("nal");
// });
// $(document).on('click', '.check-beznal', function() {
//     setTimeout(function () {
//         $('.cart-mail').val('безналичные')
//     }, 10);
//
//     console.log("beznal");
// });

$(document).on('click', '.check-type', function() {
    if ($(this).is('.check-nal')) {
        setTimeout(function() {
            $('.cart-mail').val('наличные')
        }, 10);
    } else {
        setTimeout(function() {
            $('.cart-mail').val('безналичные')
        }, 10);
    }
});
