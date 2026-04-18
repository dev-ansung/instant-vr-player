import selfsigned from 'selfsigned';

const pems = await selfsigned.generate(
    [{ name: 'commonName', value: 'localhost' }],
    { days: 365 }
);
console.log(pems);