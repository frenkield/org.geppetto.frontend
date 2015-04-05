package org.geppetto.frontend.controllers;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class CompressionUtils {

    private static Log logger = LogFactory.getLog(CompressionUtils.class);

    public byte[] compressMessageBinary(String message) throws IOException {

        long startTime = System.currentTimeMillis();

        ByteArrayOutputStream compressedMessageStream = new ByteArrayOutputStream();
        GZIPOutputStream gzipOutputStream = new GZIPOutputStream(compressedMessageStream);

        gzipOutputStream.write(message.getBytes());
        gzipOutputStream.close();

        byte[] compressedMessage = compressedMessageStream.toByteArray();
        compressedMessageStream.close();

        long elapsedTime = System.currentTimeMillis() - startTime;

        logger.info(String.format("compressed message from %d to %d bytes in %dms", message.length(),
                compressedMessage.length, elapsedTime));

        return compressedMessage;
    }

    public byte[] compressMessageBinary(byte[] message) throws IOException {

        long startTime = System.currentTimeMillis();

        ByteArrayOutputStream compressedMessageStream = new ByteArrayOutputStream();
        GZIPOutputStream gzipOutputStream = new GZIPOutputStream(compressedMessageStream);

        gzipOutputStream.write(message);
        gzipOutputStream.close();

        byte[] compressedMessage = compressedMessageStream.toByteArray();
        compressedMessageStream.close();

        long elapsedTime = System.currentTimeMillis() - startTime;

        logger.info(String.format("compressed message from %d to %d bytes in %dms", message.length,
                compressedMessage.length, elapsedTime));

        return compressedMessage;
    }
}
