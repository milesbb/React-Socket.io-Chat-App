import { formatDistance } from "date-fns";
import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  FormControl,
  ListGroup,
} from "react-bootstrap";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", { transports: ["websocket"] });

const Home = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  const handleUsernameSubmit = () => {
    socket.emit("setUsername", { username });
  };

  const sendMessage = () => {
    const newMessage = {
      text: message,
      sender: username,
      createdAt: new Date(),
    };
    socket.emit("sendMessage", { message: newMessage });
    // PUT ARRAY SPREAD INTO FUCTION AND THEN JUST CALL FUNCTION IN CALLBACK WITHIN SET CHAT HISTORY
    setChatHistory([...chatHistory, newMessage]);
    setMessage("");
  };

  useEffect(() => {
    socket.on("welcome", (welcomeMessage) => {
      socket.on("loggedIn", (onlineUsersList) => {
        setLoggedIn(true);
        setOnlineUsers(onlineUsersList);
        socket.on("newConnection", (onlineUsersList) => {
          setOnlineUsers(onlineUsersList);
        });
        socket.on("sentMessage", (receivedMessage) => {
          setChatHistory((chatHistory) => [
            ...chatHistory,
            receivedMessage.message,
          ]);

          console.log("DID ME sentMessage");
        });
      });
    });
  });

  useEffect(() => {
    return () => {
      socket.removeAllListeners();
    };
  }, []);

  return (
    <Container fluid>
      <Row style={{ height: "95vh" }} className="my-3">
        <Col md={9} className="d-flex flex-column justify-content-between">
          {!loggedIn && (
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleUsernameSubmit();
              }}
            >
              <FormControl
                placeholder="Enter your username here"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form>
          )}
          <ListGroup>
            {chatHistory.map((message, index) => (
              <ListGroup.Item key={index}>
                <Row>
                  <Col md={1}>
                    <span className="font-weight-bold">{message.sender}</span>
                  </Col>
                  <Col md={7}>
                    <span>{message.text}</span>
                  </Col>
                  <Col md={4}>
                    sent{" "}
                    {formatDistance(new Date(message.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
          {loggedIn && (
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                console.log("form triggered");
                sendMessage();
              }}
            >
              <FormControl
                placeholder="Write your message here"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Form>
          )}
        </Col>
        <Col md={3}>
          <div className="mb-3">Connected users:</div>
          {onlineUsers.length === 0 && (
            <ListGroup.Item>
              You can see your fellow chatters when you log in...
            </ListGroup.Item>
          )}
          <ListGroup>
            {onlineUsers.map((user) => (
              <ListGroup.Item key={user.socketId}>
                {user.username}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
