import type { NextPage } from 'next'
import React, { createContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Button,
    ButtonGroup,
    FormControl,
    FormLabel,
    HStack,
    Input,
    InputGroup,
    InputLeftAddon,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    PinInput,
    PinInputField,
    useDisclosure,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useRecoilState } from 'recoil';
import { currentUserIDState } from '../contexts/user';
import { NodeNextRequest } from 'next/dist/server/base-http/node';
import { now } from 'lodash';
import style from '../styles/Home.module.css';

const loginUrl = "http://127.0.0.1:8000/login";
const authUrl = "http://127.0.0.1:8000/auth";

export const Home: NextPage = () => {
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [code, setCode] = useState("");
    const [isCode, setIsCode] = useState(false);
    const [_, setUserId] = useRecoilState(currentUserIDState);
    const router = useRouter()
    const handleName: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        setName(event.target.value);
    }
    const [isPinErr, setIsPinErr] = useState(true);
    const [isUserErr, setIsUserErr] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure()

    const Timer = () => {
        const [min, setMin] = useState(3);
        const [sec, setSec] = useState(0);
        const time = useRef(20);
        const timerld = useRef(null);

        useEffect(() => {
            timerld.current = setInterval(() => {
                setMin(parseInt(time.current / 60));
                setSec(time.current % 60);
                time.current -= 1;
            }, 1000);

            return () => clearInterval(timerld.current);
        }, []);

        useEffect(() => {
            if(time.current < 0){
                console.log('타임아웃 시 발생 이벤트 작성')
                clearInterval(timerld.current);
            }
        }, [sec]);

        return(
            <div className={style.timer}>{min} : {sec}</div>
        )
    }

    const handlePhoneNumber: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        setPhoneNumber(event.target.value);
    }

    const handleCode: ((value: string) => void) = (value) => {
        setCode(value)
    }

    const handleLogin: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = {
            name: name,
            phone_num: phoneNumber,
        }

        axios.post(loginUrl, data, {
            headers: {
                "Access-Control-Allow-Origin": "http://127.0.0.1:3000"
            }
        }).then((res) => {
            setIsCode(false)
            console.log(res)
        })
    }

    const handleAuth: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = {
            name: name,
            phone_num: phoneNumber,
        }
        
        axios.post(authUrl+`/${code}`, data).then((res) => {
            if (res.status == 200){
                setUserId(res.data._id)
                router.push('/user')
            }

        }).catch((e)=>{
            let errorCode = e.response.status;
            console.log(errorCode);
            if (errorCode == 400){//400: 핀번호 오류 - 핀번호 재입력 유도
                console.log(errorCode, "pin num error");
                setIsPinErr(false)
                onOpen()
                setCode("");
            }else if(errorCode == 408){//408: 시간초과 - 핀번호 백으로 다시 요청해서 새로 받기
                console.log(errorCode, "time out");
            }else if(errorCode == 404){//404: 사용자 데이터 입력 오류 - 사용자 정보(이름, 전화번호) 재입력
                console.log(errorCode, "other reason err");
                setIsUserErr(false)
                onOpen()
                setName("");
                setPhoneNumber("");
            }
        })
    }
    
    return (
        <div className={style.container}>
            <div className={style.total}>
                <div className={style.logInArea}>
                    <form className={style.logInForm} onSubmit={isCode ? handleLogin : handleAuth}>
                        <div className={style.headText}>
                            <p>TAS<br></br>Log In</p>
                        </div>
                        <FormControl isRequired>
                            <FormLabel htmlFor='name' style={{
                                color: 'white'
                            }}>Name</FormLabel>
                            <Input
                                id='name'
                                value={name}
                                onChange={handleName}
                                placeholder='name'
                                style={{color: 'white'}}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel htmlFor='phoneNumber' style={{
                                color: 'white'
                            }}>PhoneNumber</FormLabel>
                            <InputGroup>
                                <InputLeftAddon children='+82' />
                                <Input
                                    id='phoneNumber'
                                    value={phoneNumber}
                                    onChange={handlePhoneNumber}
                                    type='tel'
                                    placeholder='phone number'
                                    style={{color: 'white'}}
                                />
                            </InputGroup>
                        </FormControl>
                        {
                            isCode ? (
                                    <button className={style.pinSubmit}
                                        type='submit'
                                    >
                                        인증번호 받기
                                    </button>
                            ) : (
                                    <div className={style.pinInput}>
                                        <div>
                                            <PinInput otp value={code} onChange={handleCode} style={{
                                                borderColor : 'white',
                                            }}>
                                                <PinInputField style={{color: 'white'}}/>
                                                <PinInputField style={{color: 'white'}}/>
                                                <PinInputField style={{color: 'white'}}/>
                                                <PinInputField style={{color: 'white'}}/>
                                                <PinInputField style={{color: 'white'}}/>
                                                <PinInputField style={{color: 'white'}}/>
                                            </PinInput>
                                        </div>
                                        <button className={style.Submit} type='submit'>
                                            확인
                                        </button>
                                        <Timer />
                                    </div>
                            )
                        }                
                    </form>
                </div>
            </div>
            {
                isPinErr ? (
                    <div></div>
                ) : (
                    <div>
                        <Modal isOpen={isOpen} onClose={onClose} isCentered>
                            <ModalOverlay />
                            <ModalContent>
                                <ModalHeader>400 Error</ModalHeader>
                            <ModalCloseButton />
                                <ModalBody>
                                    핀 번호를 다시 확인해주세요.
                                </ModalBody>
                            <ModalFooter>
                                <Button onClick={onClose}>
                                    확인
                                </Button>
                            </ModalFooter>
                            </ModalContent>
                        </Modal>
                    </div>
                )
            }
            {
                isUserErr ? (
                    <div></div>
                ) : (
                    <div>
                        <Modal isOpen={isOpen} onClose={onClose} isCentered>
                            <ModalOverlay />
                            <ModalContent>
                                <ModalHeader>404 ERROR</ModalHeader>
                            <ModalCloseButton />
                                <ModalBody>
                                    올바르지 않은 유저 정보입니다.
                                </ModalBody>
                            <ModalFooter>
                                <Button onClick={onClose}>
                                    확인
                                </Button>
                            </ModalFooter>
                            </ModalContent>
                        </Modal>
                    </div>
                )
            }
        </div>
    )
}
export default Home;