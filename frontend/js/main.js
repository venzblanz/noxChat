const switchBtn = document.getElementById('switch-btn');
const confirmField = document.getElementById('confirm-field');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const switchText = document.getElementById('switch-text');
const leftChar = document.getElementById('left-char');
const rightChar = document.getElementById('right-char');

let isLogin = true;

const handleSwitch = (e) =>{
    e.preventDefault();
    isLogin = !isLogin;

    if(isLogin){
        formTitle.textContent = 'LOGIN';
        submitBtn.textContent = 'Login';
        confirmField.style.display = 'none';
        switchText.childNodes[0].textContent = "Don't have an account yet? ";
        switchBtn.textContent = 'Sign-up';
        rightChar.style.display = 'block';
        document.getElementById('left-char').src = 'images/knek.png';
    }else{
        formTitle.textContent = 'SIGN-UP';
        submitBtn.textContent = "Register";
        confirmField.style.display = 'block';
        switchText.childNodes[0].textContent = 'Already have an account? ';
        switchBtn.textContent = 'Login';
        rightChar.style.display = 'none';
        document.getElementById('left-char').src = 'images/noxia_sc.png';
    }
}
switchBtn.addEventListener('click', handleSwitch);

submitBtn.addEventListener('click', async() =>{
    const username = document.querySelector('input[type="text"]').value;
    const password = document.querySelectorAll('input[type="password"]')[0].value;
    if(!isLogin){
        const confirmPass = document.querySelectorAll('input[type="password"]')[1].value;
        if(password !== confirmPass){
            alert('Passwords do not match!');
            return;
        }
    }
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if(res.ok){
        alert(data.message);
        if(isLogin){
            localStorage.setItem('userId', data.userId);
            window.location.href = '/home';
        }else{
            document.querySelector('input[type="text"]').value = '';
            document.querySelectorAll('input[type="password"]').forEach(input => input.value = '');
            
            // switch back to login mode [harcoded lol]
            isLogin = true;
            formTitle.textContent = 'LOGIN';
            submitBtn.textContent = 'Login';
            confirmField.style.display = 'none';
            switchText.childNodes[0].textContent = "Don't have an account yet? ";
            switchBtn.textContent = 'Sign-up';
            rightChar.style.display = 'block';
            document.getElementById('left-char').src = 'images/knek.png';
        }
    }else{
        alert(data.error);
    }
});
function backToHome(){
    window.location.replace("/home");
}
