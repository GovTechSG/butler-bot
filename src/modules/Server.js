/**
 * Created by edisonchee on 26/1/17.
 */
import { default as restify } from 'restify';

const server = restify.createServer();

server.use(restify.bodyParser());

server.post('/gcal/events', (req, res) => {
    console.log(req);
    console.log(res);
    res.send(204);
});

server.get('/', (req, res) => {
    console.log(req);
    res.send(204);
});

server.listen(7777, () => {
    console.log(`${server.name} listening at ${server.url}`);
});

function getCalChanges(syncToken) {

}