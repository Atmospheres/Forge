package com.forge.dto;

import com.forge.model.Workspace;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.UUID;

public class WorkspaceDto {

    public record Response(
        UUID id,
        String name,
        String ownerSub,
        Instant createdAt
    ) {
        public static Response from(Workspace workspace) {
            return new Response(
                workspace.getId(),
                workspace.getName(),
                workspace.getOwnerSub(),
                workspace.getCreatedAt()
            );
        }
    }

    public record CreateRequest(
        @NotBlank String name
    ) {}

    public record UpdateRequest(
        @NotBlank String name
    ) {}
}