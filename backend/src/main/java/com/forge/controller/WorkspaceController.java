package com.forge.controller;

import com.forge.dto.WorkspaceDto;
import com.forge.model.Workspace;
import com.forge.repository.WorkspaceRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;

    public WorkspaceController(WorkspaceRepository workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
    }

    @GetMapping
    public List<WorkspaceDto.Response> listMyWorkspaces(@AuthenticationPrincipal Jwt jwt) {
        return workspaceRepository.findByOwnerSub(jwt.getSubject())
            .stream()
            .map(WorkspaceDto.Response::from)
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceDto.Response createWorkspace(
        @Valid @RequestBody WorkspaceDto.CreateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        Workspace workspace = new Workspace(request.name(), jwt.getSubject());
        return WorkspaceDto.Response.from(workspaceRepository.save(workspace));
    }

    @GetMapping("/{workspaceId}")
    public WorkspaceDto.Response getWorkspace(@PathVariable UUID workspaceId, @AuthenticationPrincipal Jwt jwt) {
        return workspaceRepository.findById(workspaceId)
            .filter(workspace -> workspace.getOwnerSub().equals(jwt.getSubject()))
            .map(WorkspaceDto.Response::from)
            .orElseThrow(() -> new NoSuchElementException("Workspace not found"));
    }

    @PatchMapping("/{workspaceId}")
    public WorkspaceDto.Response renameWorkspace(
        @PathVariable UUID workspaceId,
        @Valid @RequestBody WorkspaceDto.UpdateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        Workspace workspace = findOwnedWorkspaceOrThrow(workspaceId, jwt);
        workspace.setName(request.name());
        return WorkspaceDto.Response.from(workspaceRepository.save(workspace));
    }

    @DeleteMapping("/{workspaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWorkspace(@PathVariable UUID workspaceId, @AuthenticationPrincipal Jwt jwt) {
        Workspace workspace = findOwnedWorkspaceOrThrow(workspaceId, jwt);
        // Cascades to projects and tasks via ON DELETE CASCADE in the schema
        workspaceRepository.delete(workspace);
    }

    private Workspace findOwnedWorkspaceOrThrow(UUID workspaceId, Jwt jwt) {
        return workspaceRepository.findById(workspaceId)
            .filter(workspace -> workspace.getOwnerSub().equals(jwt.getSubject()))
            .orElseThrow(() -> new NoSuchElementException("Workspace not found"));
    }
}