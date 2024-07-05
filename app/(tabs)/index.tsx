import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, StyleSheet, Text } from 'react-native';

import OpenAI from 'openai';
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        console.log('key------------------', apiKey);

const openai = new OpenAI({
        organization:'',
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
});

interface Message {
        text: string;
        isCurrentUser: boolean;
}

const ChatScreen: React.FC = () => {
        const [messages, setMessages] = useState<Message[]>([]);
        const [newMessage, setNewMessage] = useState('');
        

        // useEffect(()=> {
        // },[messages])

        const timeoutDelay = 4000;
        const waitForTimeout = (runId: string, theradId: string) => {
                console.log("inside timeout")
                return new Promise<void>((resolve) => {
                    setTimeout(async () => {
                        let status = await openai.beta.threads.runs.retrieve(theradId, runId);
                
                        resolve();      
                
                    }, timeoutDelay);
                });
            }
        
        const sendMessage = async () => {
                const assistant = await openai.beta.assistants.retrieve("asst_vXbJmAUntVzZ5Ziw3xCAMifT");
                if (newMessage) {
                        setMessages([
                                ...messages, 
                                { 
                                        text: newMessage, 
                                        isCurrentUser: true 
                                }
                        ]);
                        setNewMessage('');
                }
                const thread = await openai.beta.threads.create();

                sendMessageOpenAi(thread.id, assistant.id);
        };

        const sendMessageOpenAi = async (threadId: string, assistantId: string) => {
                const threadMessages = await openai.beta.threads.messages.create(
                        threadId,
                        { role: "user", content: newMessage }
                )
                
                const run = await openai.beta.threads.runs.create(
                        threadId,
                        {assistant_id: assistantId}
                )
                getOpenAiMessage(threadId, run.id)
        }

        const getOpenAiMessage = async (threadId: string, runId: string) => {
                
                await waitForTimeout(runId, threadId)
                const messageList = await openai.beta.threads.messages.list(
                        threadId,
                        {run_id: runId}
                );
                setMessages(messages => [
                        ...messages, 
                        { 
                                text: messageList.data[0].content[0].text.value, 
                                isCurrentUser: false 
                        }
                ]);
                
        }
      
        return (
                <View style={styles.container}>
                        <FlatList
                                data={messages}
                                renderItem={({ item }) => (
                                        <View style={item.isCurrentUser ? styles.currentUserMessage : styles.receivedMessage}>
                                                <Text>{item.text}</Text>
                                        </View>
                                )}
                        />
                        <View style={styles.inputContainer}>
                                <TextInput
                                        value={newMessage}
                                        onChangeText={setNewMessage}
                                        placeholder="Type your message..."
                                        style={styles.textInput}
                                />
                                <Button title="Send" onPress={sendMessage} disabled={!newMessage} />
                        </View>
                </View>
        );
      };
      
        const styles = StyleSheet.create({
                container: {
                        flex: 1,
                },
                currentUserMessage: {
                        backgroundColor: '#BDBDBD',
                        padding: 10,
                        alignSelf: 'flex-end',
                        marginRight: 10,
                        marginBottom: 5,
                        borderRadius: 10,
                },
                receivedMessage: {
                        backgroundColor: '#EAEAEA',
                        padding: 10,
                        alignSelf: 'flex-start',
                        marginLeft: 10,
                        marginBottom: 5,
                        borderRadius: 10,
                },
                inputContainer: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 10,
                        backgroundColor: '#5E5757',
                },
                textInput: {
                        flex: 1,
                        marginRight: 10,
                },
        });
      
      export default ChatScreen;      