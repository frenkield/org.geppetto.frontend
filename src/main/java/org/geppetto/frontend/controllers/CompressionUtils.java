package org.geppetto.frontend.controllers;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class CompressionUtils {

    private ByteArrayOutputStream compressedMessageStream;
    private GZIPOutputStream gzipOutputStream;
    private PrintWriter compressedMessageWriter;

    private static Log logger = LogFactory.getLog(CompressionUtils.class);

    public CompressionUtils() {

        try {

            compressedMessageStream = new ByteArrayOutputStream();
            gzipOutputStream = new GZIPOutputStream(compressedMessageStream);
            compressedMessageWriter = new PrintWriter(gzipOutputStream);

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public String compressMessage(String message) throws IOException {

        long startTime = System.currentTimeMillis();

        compressedMessageStream.reset();
        compressedMessageWriter.print(message);
        compressedMessageWriter.flush();

        String compressedMessage = new String(compressedMessageStream.toByteArray());
        long elapsedTime = System.currentTimeMillis() - startTime;

        logger.info(String.format("******* compressed message from %d to %d bytes in %dms", message.length(),
                                  compressedMessage.length(), elapsedTime));

        return compressedMessage;
    }

    public byte[] compressMessageBinary(String message) throws IOException {

        long startTime = System.currentTimeMillis();

        compressedMessageStream.reset();
        compressedMessageWriter.print(message);
        compressedMessageWriter.flush();
        gzipOutputStream.finish();

        byte[] compressedMessage = compressedMessageStream.toByteArray();
        long elapsedTime = System.currentTimeMillis() - startTime;

        logger.info(String.format("******* compressed message from %d to %d bytes in %dms", message.length(),
                compressedMessage.length, elapsedTime));

        return compressedMessage;
    }
}
