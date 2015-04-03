package org.geppetto.frontend.controllers;

import com.google.gson.Gson;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.CharBuffer;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.frontend.GeppettoTransportMessage;
import org.geppetto.frontend.OUTBOUND_MESSAGE_TYPES;
import org.geppetto.frontend.TransportMessageFactory;

public class MessageSenderService {

    private ArrayBlockingQueue<Runnable> preprocessorQueue = new ArrayBlockingQueue<>(20);

    private ThreadPoolExecutor preprocessorExecutor =
            new ThreadPoolExecutor(1, 1, 10, TimeUnit.SECONDS, preprocessorQueue,
                                   new ThreadPoolExecutor.DiscardOldestPolicy());

    private ArrayBlockingQueue<Runnable> senderQueue = new ArrayBlockingQueue<>(20);

    private ThreadPoolExecutor senderExecutor =
            new ThreadPoolExecutor(1, 1, 10, TimeUnit.SECONDS, senderQueue,
                    new ThreadPoolExecutor.DiscardOldestPolicy());

    private static Log logger = LogFactory.getLog(MessageSenderService.class);




    public void sendMessage(GeppettoMessageInbound visitor, String message) {

        try {
            senderExecutor.execute(new MessageSender(visitor, message));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }



    public void sendMessage(GeppettoMessageInbound connection, String requestID, OUTBOUND_MESSAGE_TYPES type,
                            String update) {

        try {
            preprocessorExecutor.execute(new Preprocessor(connection, requestID, type, update));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }



    public void sendMessage(GeppettoMessageInbound connection, String requestID, OUTBOUND_MESSAGE_TYPES type,
                            List<Double> particles) {

        try {
            senderExecutor.execute(new ParticlePreprocessor(connection, particles));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }



    private class MessageSender implements Runnable {

        private GeppettoMessageInbound visitor;
        private String message;

        public MessageSender(GeppettoMessageInbound visitor, String message) throws IOException {
            this.visitor = visitor;
            this.message = message;

            logger.info(">>>>>>>>>>>>>>>>>>>>> sender queue size = " + senderQueue.size());
        }

        public void run() {

            long startTime = System.currentTimeMillis();

            try {

                CharBuffer buffer = CharBuffer.wrap(message);
                visitor.getWsOutbound().writeTextMessage(buffer);

            } catch (IOException e) {
                e.printStackTrace();
            }

            long elapsedTime = System.currentTimeMillis() - startTime;

            logger.info(String.format("******* sent %d bytes in %dms", message.length(), elapsedTime));
        }
    }




//    private class DoubleMessageSender implements Runnable {
//
//        private GeppettoMessageInbound visitor;
//        private double[] message;
//
//        public DoubleMessageSender(GeppettoMessageInbound visitor, double[] message) throws IOException {
//            this.visitor = visitor;
//            this.message = message;
//
//            logger.info(">>>>>>>>>>>>>>>>>>>>> sender queue size = " + senderQueue.size());
//        }
//
//        public void run() {
//
//            long startTime = System.currentTimeMillis();
//
//            try {
//
//                visitor.getWsOutbound().writeBinaryMessage(DoubleBuffer.wrap(message));
//
//
//            } catch (IOException e) {
//                e.printStackTrace();
//            }
//
//            long elapsedTime = System.currentTimeMillis() - startTime;
//
//            logger.info(String.format("******* sent %d binary bytes in %dms", message.length, elapsedTime));
//        }
//    }





    private class BinaryMessageSender implements Runnable {

        private GeppettoMessageInbound visitor;
        private ByteBuffer message;

        public BinaryMessageSender(GeppettoMessageInbound visitor, ByteBuffer message) throws IOException {
            this.visitor = visitor;
            this.message = message;

            logger.info(">>>>>>>>>>>>>>>>>>>>> sender queue size = " + senderQueue.size());
        }

        public void run() {

            long startTime = System.currentTimeMillis();

            try {
                visitor.getWsOutbound().writeBinaryMessage(message);

            } catch (IOException e) {
                e.printStackTrace();
            }

            long elapsedTime = System.currentTimeMillis() - startTime;

            logger.info(String.format("******* sent %d binary bytes in %dms", message.capacity(), elapsedTime));
        }
    }







    private class ParticlePreprocessor implements Runnable {

        private GeppettoMessageInbound visitor;
        private List<Double> particles;

        private CompressionUtils compressionUtils = new CompressionUtils();
        boolean useCompression = false;

        public ParticlePreprocessor(GeppettoMessageInbound visitor, List<Double> particles) throws IOException {

            this.visitor = visitor;
            this.particles = particles;

            logger.info(">>>>>>>>>>>>>>>>>>>>> preprocessor queue size = " + preprocessorQueue.size());
        }

        public void run() {

            try {

                long startTime = System.currentTimeMillis();

                ByteBuffer byteBuffer = ByteBuffer.allocate(particles.size() * 8);
                byteBuffer.order(ByteOrder.LITTLE_ENDIAN);

                for (Double particle : particles) {
                    byteBuffer.putDouble(particle);
                }

                byte[] compressedMessage = compressionUtils.compressMessageBinary(byteBuffer.array());
                ByteBuffer compressedByteBuffer = ByteBuffer.wrap(compressedMessage);
                logger.info("********************** " + compressedMessage.length);


                long elapsedTime = System.currentTimeMillis() - startTime;
                logger.info(String.format("******* compressed and created particle byte buffer in %dms", elapsedTime));

                senderExecutor.execute(new BinaryMessageSender(visitor, compressedByteBuffer));





//                if (!useCompression || message.length() < 1000) {
//                    senderExecutor.execute(new MessageSender(visitor, message));
//
//                } else {


//                    byte[] binaryMessage = compressionUtils.compressMessageBinary(message);
//                    senderExecutor.execute(new BinaryMessageSender(visitor, binaryMessage));


//                }

            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }









    private class Preprocessor implements Runnable {

        private GeppettoMessageInbound visitor;
        private String requestId;
        private OUTBOUND_MESSAGE_TYPES type;
        private String update;
        private CompressionUtils compressionUtils = new CompressionUtils();
        boolean useCompression = false;

        public Preprocessor(GeppettoMessageInbound visitor, String requestId, OUTBOUND_MESSAGE_TYPES type,
                            String update) throws IOException {

            this.visitor = visitor;
            this.requestId = requestId;
            this.type = type;
            this.update = update;

            logger.info(">>>>>>>>>>>>>>>>>>>>> preprocessor queue size = " + preprocessorQueue.size());
        }

        public void run() {

            long startTime = System.currentTimeMillis();

            try {

                GeppettoTransportMessage transportMsg =
                        TransportMessageFactory.getTransportMessage(requestId, type, update);

                long elapsedTime = System.currentTimeMillis() - startTime;
                logger.info(String.format("******* created transport message in %dms", elapsedTime));

                startTime = System.currentTimeMillis();

                String message = new Gson().toJson(transportMsg);

                elapsedTime = System.currentTimeMillis() - startTime;
                logger.info(String.format("******* created json in %dms", elapsedTime));


                byte[] compressedMessage = compressionUtils.compressMessageBinary(message);
                logger.info("))))))))))))) if we were compressing message would be " + compressedMessage.length);



                if (!useCompression || message.length() < 1000) {
                    senderExecutor.execute(new MessageSender(visitor, message));

                } else {

//                    byte[] binaryMessage = compressionUtils.compressMessageBinary(message);
//                    senderExecutor.execute(new BinaryMessageSender(visitor, binaryMessage));
                }

            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
