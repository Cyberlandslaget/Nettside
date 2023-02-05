/* * * * * * * * * *
 *  HTML FUNCTIONS *
 * * * * * * * * * */

const globalModalStack = [];

window.addEventListener('keydown', (event) => {
	if (globalModalStack.length > 0) {
		if (event.key == 'Escape') {
			event.stopPropagation();
			globalModalStack.pop().remove();
		}
	}
});

const createElement = (tag, text, options, ...children) => {
	const classes = tag.split('.');
	const el = document.createElement(classes.shift());
	classes.forEach(c => c && el.classList.add(c));
	if (text) el.textContent = text;
	if (options) {
		Object.entries(options).forEach(([k, v]) => el[k] = v);
	}
	children.forEach(c => c && el.appendChild(c));
	return el;
}

const elementJoin = (elements, inject) => {
	elements = elements.map(el => [el, inject]).flat();
	if (elements.length) elements.pop();
	return elements;
}

const button = (text, callback) => {
	const button = createElement('button', text);
	button.addEventListener('click', callback);
	return button;
}

const modal = (title, body, buttons = {'Close': null}) => {
	const _self = [];
	const remove = () => _self[0].remove();
	const backdrop = createElement('div.modal.backdrop', 0,
		createElement('div.modal.body', 0, 0, 
			createElement('h1', title),
			createElement('hr'),
			createElement('p', body),
			createElement('hr'),
			createElement('div.buttons', 0, 0, ...Object.entries(buttons).map(([name, cb]) => button(name, cb || remove))),
		)
	);
	_self[0] = backdrop;
	globalModalStack.push(backdrop);
	document.body.insertBefore(backdrop, document.body.lastChild);
}

/**
 * @type needs to be in ['info', 'warn', 'error', 'ok'] (ignore case)
 */
const toast = (title, body, type = 'Info') => {
	type = type.toLowerCase();
	const types = {info: ['💬', '#999'], warn: ['⚠️', '#fc0'], error: ['⛔️', '#f42'], danger: ['⛔️', '#f42'], ok: ['✅', '#2a2']};
	const [icon, color] = types[type] || types.info;
	console.group(icon, title)
	console.log(body);
	console.groupEnd();
	const toast = createElement('div.toast', 0, 0,
		createElement('h3.upper.font-primary.text-red.v-spacing-md', icon + ' ' + title),
		createElement('span.font-primary', body)
	);
	toast.style.borderColor = color;
	toast.addEventListener('click', () => {
		toast.remove();
	})

	let toaster = document.getElementById('toaster');
	if (!toaster) {
		toaster = createElement('div');
		toaster.id = 'toaster';
		document.body.insertBefore(toaster, document.body.firstChild);
	}
	toaster.appendChild(toast);
}

/* * * * * * * * *
 * API FUNCTIONS *
 * * * * * * * * */
const api = async (path, method = 'GET', json = 0, quiet = false) => {
	const options = {
		method,
		credentials: 'same-origin'
	}
	if (json) {
		options.headers = {'Content-Type': 'application/json'};
		options.body = JSON.stringify(json);
	}
	const res = await fetch(`/api${path}`, options);
	const data = await (res.headers.get('Content-Type').includes('application/json') ? res.json() : res.text());
	if (!res.ok) {
		const msg = data.message || (data.detail && data.detail[0].msg) || data.detail || data;
		if(!quiet) {
			toast(`Error fetching ${path}:`, msg, 'danger');
			throw msg;
		} else {
			return null;
		}
	}
	return data;
}
const fetchChallenges = async () => {
	return await api('/challenges');
}
const fetchProfile = async (quiet = false) => {
	return await api('/self', 'GET', 0, quiet);
}
const updateProfile = async (profile) => {
	return await api('/self', 'POST', profile);
}
const submitFlag = async (challenge, challengeName, flag) => {
	const res = await api(`/challenge/${challenge}/solve`, 'POST', {flag});
	if (res.correct) {
		toast(`You solved ${challengeName} 🎉`, '', 'ok');
	} else {
		toast(`Sorry, incorrect flag 😢`, '', 'warn');
	}
	if (res.access_token) {
		toast('Profile created!', 'You can view your profile under /profile!');
	}
	return res;
}
const fetchScoreboard = async () => {
	return await api('/scoreboard');
}

/* Fancy animations */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
}

